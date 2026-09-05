/**
 * 5e Character Sheets — Setup
 *
 * This is a set of notes and bases that have template values which
 * that can be copied and replaced to make an instance of a
 * campaign's Player Character sheets.
 *
 * This script clones the template package to a user-chosen
 * directory, replacing "MyCampaign" with the campaign name
 * throughout. It also copies the CSS snippet to .obsidian/snippets/
 * (if not present).
 *
 * @requires JS Engine plugin (js-engine)
 *
 * Copyright (c) 2026 Artfulreggie.
 */


const SOURCE_ROOT = context.file.parent.path;
// Obsidian names the vault root "/", which would double the separator.
const SOURCE_DIR =
  SOURCE_ROOT === "/" || SOURCE_ROOT === "" ? "" : `${SOURCE_ROOT}/`;
const CAMPAIGN_TOKEN = "MyCampaign";
const UNSAFE_CHARS = /[\\/:*?"<>|#`\[\]{}\x00-\x1f\x7f]/;
const MAX_NAME_LENGTH = 80;

const FILES = [
  "Templates/MyCampaign - CHARACTER TEMPLATE.md",
  "MyCampaign - Instructions.md",
  "MyCampaign - Player Characters.md",
  "create-character.js",
  "Templates/MyCampaign - CHARACTER TEMPLATE - Notes.md",
  "Templates/MyCampaign - CHARACTER TEMPLATE - Data.md",
  "Base/MyCampaign - Base - Abilities.base",
  "Base/MyCampaign - Base - Skills.base",
  "Base/MyCampaign - Base - Combat.base",
];


// ----------
// Validation
// ----------

/**
 * Why this campaign name cannot be used, or null when it can.
 *
 * @param {string} name - Trimmed campaign name
 * @returns {{title: string, content: string}|null}
 */
const campaignProblem = (name) => {
  if (name === "") {
    return {
      title: "No Campaign Name",
      content: "Enter a name for your campaign.",
    };
  }

  if (UNSAFE_CHARS.test(name)) {
    return {
      title: "Invalid Campaign Name",
      content: `"${name}" contains invalid characters.\n\nAvoid: \\ / : * ? " < > | # \` [ ] { }`,
    };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      title: "Campaign Name Too Long",
      content: `Campaign name too long (max ${MAX_NAME_LENGTH} characters).`,
    };
  }

  return null;
};

/**
 * The install location as the copy loop will use it: no surrounding
 * whitespace, no trailing separators.
 *
 * @param {string} raw
 * @returns {string}
 */
const normalizeTarget = (raw) => raw.trim().replace(/\/+$/, "");

/**
 * Why this install location cannot be used, or null when it can.
 *
 * Takes the normalized value, not the raw one. "/" normalizes to "",
 * and checking before that happened let it through as a vault-root
 * install.
 *
 * @param {string} target - Normalized install path
 * @returns {{title: string, content: string}|null}
 */
const targetProblem = (target) => {
  if (target === "") {
    return {
      title: "No Install Location",
      content:
        "Enter a folder for the campaign.\n\n" +
        "The vault root is not a valid location.",
    };
  }

  const segments = target.split("/");
  if (
    target.startsWith("/") ||
    target.startsWith(".") ||
    segments.some((s) => s === ".." || s === "." || s === "")
  ) {
    return {
      title: "Invalid Install Location",
      content:
        "Install path must be a simple vault-relative path.\n\n" +
        'No "..", ".", empty folder names, or absolute paths.',
    };
  }

  return null;
};

/**
 * Ask until the answer is usable. Names the problem and asks again.
 * Returns null if the user cancels the text prompt or declines a retry.
 *
 * @param {{title: string, content: string, placeholder: string}} prompt
 * @param {object} rules
 * @param {(raw: string) => string} [rules.normalize] - Defaults to trimming
 * @param {(value: string) => {title: string, content: string}|null} rules.problemWith
 * @returns {Promise<string|null>}
 */
const promptUntilValid = async (
  prompt,
  { normalize = (s) => s.trim(), problemWith }
) => {
  while (true) {
    const raw = await engine.prompt.text(prompt);
    if (raw === undefined || raw === null) return null;

    const value = normalize(raw);
    const problem = problemWith(value);
    if (!problem) return value;

    const retry = await engine.prompt.confirm({
      title: problem.title,
      content: `${problem.content}\n\nPress Confirm to try again, or Cancel to stop.`,
    });

    if (!retry) return null;
  }
};


// ------
// Prompt
// ------

const campaign = await promptUntilValid({
  title: "5e Character Sheets — New Campaign",
  content:
    "Enter your campaign name.\n\n" +
    'This will prefix all filenames.\n(e.g. "Strahd" --> "Strahd - John Smith.md")',
  placeholder: "My Campaign",
}, { problemWith: campaignProblem });

if (campaign === null) {
  new Notice("Installation cancelled.");
  return;
}

const target = await promptUntilValid({
  title: "Install Location",
  content:
    `Where should "${campaign}" character sheets be installed?\n\n` +
    "(Vault-relative path — created if it doesn't exist)",
  placeholder: `TTRPG/5e/Campaigns/${campaign}/Party`,
}, { normalize: normalizeTarget, problemWith: targetProblem });

if (target === null) {
  new Notice("Installation cancelled.");
  return;
}

// -------
// Confirm
// -------

const confirmed = await engine.prompt.confirm({
  title: "Confirm Installation",
  content:
    `Campaign: ${campaign}\n` +
    `Location: ${target}/\n\n` +
    `Files will be created with the prefix "${campaign}".\n` +
    "CSS snippet will be copied to .obsidian/snippets/.\n\n" +
    "Proceed?",
});

if (!confirmed) {
  new Notice("Installation cancelled.");
  return;
}


// ------------
// Installation
// ------------

try {
  for (const dir of [
    target,
    `${target}/Character Info`,
    `${target}/Base`,
    `${target}/Templates`,
  ]) {
    if (!(await app.vault.adapter.exists(dir))) {
      await app.vault.adapter.mkdir(dir);
    }
  }

  let copied = 0;
  let skipped = 0;

  for (const relPath of FILES) {
    const srcPath = `${SOURCE_DIR}${relPath}`;
    const destRelPath = relPath.replaceAll(CAMPAIGN_TOKEN, campaign);
    const destPath = `${target}/${destRelPath}`;

    if (await app.vault.adapter.exists(destPath)) {
      skipped++;
      continue;
    }

    const srcFile = app.vault.getAbstractFileByPath(srcPath);
    if (!srcFile) {
      new Notice(`Source not found: ${relPath}`);
      continue;
    }

    const content = await app.vault.read(srcFile);
    const transformed = content.replaceAll(CAMPAIGN_TOKEN, campaign);

    await app.vault.create(destPath, transformed);
    copied++;
  }

  // ---
  // CSS
  // ---

  // SOURCE_DIR carries its own trailing separator, as the copy loop above
  // relies on. A second one here built a path nothing matched.
  const cssSource = `${SOURCE_DIR}dnd-sheet.css`;
  const cssTarget = ".obsidian/snippets/dnd-sheet.css";

  if (!(await app.vault.adapter.exists(".obsidian/snippets"))) {
    await app.vault.adapter.mkdir(".obsidian/snippets");
  }

  if (await app.vault.adapter.exists(cssTarget)) {
    new Notice("CSS snippet previously installed.");
  } else {
    const cssFile = app.vault.getAbstractFileByPath(cssSource);
    if (cssFile) {
      const cssContent = await app.vault.read(cssFile);
      await app.vault.adapter.write(cssTarget, cssContent);
      new Notice(
        "CSS snippet installed. Enable in Obsidian:\nSettings --> Appearance --> CSS Snippets --> dnd-sheet"
      );
    } else {
      new Notice(`Source not found: ${cssSource}\n\nThe dashboards will` +
        " look plain until you copy dnd-sheet.css into .obsidian/snippets/.");
    }
  }

  new Notice(`Done! ${copied} files installed, ${skipped} skipped (already exist).`);
  new Notice(`Open "${campaign} - Instructions" in ${target}/ to get started.`);
} catch (e) {
  console.error("5e-sheets-setup:", e);
  new Notice(`Error: ${e.message}`);
}
