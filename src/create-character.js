/**
 * Create a new player character from the CHARACTER TEMPLATE files.
 *
 * Duplicates the Dashboard, Notes, and Data templates from Templates/
 * into new files at the campaign root and in Character Info/,
 * substitutes "CHARACTER TEMPLATE" with the character's name throughout,
 * clears inherited template IDs so the ID plugin can regenerate them
 * (if present), and initializes default frontmatter values in the Data file.
 *
 * @requires Meta Bind plugin (obsidian-meta-bind-plugin)
 * @requires JS Engine plugin (js-engine)
 */

// Obsidian names the vault root "/", which would double the separator.
// PARTY_DIR therefore carries its own trailing separator, and everything
// built from it leaves the slash out.
const PARENT = context.file.parent.path;
const PARTY_DIR = PARENT === "/" || PARENT === "" ? "" : `${PARENT}/`;
const CHAR_INFO_DIR = `${PARTY_DIR}Character Info`;
const TEMPLATE_DIR = `${PARTY_DIR}Templates`;
const TOKEN = "CHARACTER TEMPLATE";
const UNSAFE_CHARS = /[\\/:*?"<>|#`\[\]{}\x00-\x1f\x7f]/;
const MAX_NAME_LENGTH = 80;

/**
 * @type {Readonly<Record<string, string>>} Vault-relative template paths keyed by role.
 */
const TEMPLATES = Object.freeze({
  dashboard: `${TEMPLATE_DIR}/MyCampaign - ${TOKEN}.md`,
  notes: `${TEMPLATE_DIR}/MyCampaign - ${TOKEN} - Notes.md`,
  data: `${TEMPLATE_DIR}/MyCampaign - ${TOKEN} - Data.md`,
});

/**
 * @type {Readonly<Record<string, *>>} Default frontmatter values for new Data files.
 */
const DATA_DEFAULTS = Object.freeze({
  z_dnd_level: 1,
  z_dnd_size: "medium",
  z_dnd_languages: "Common",
  z_dnd_str: 8,
  z_dnd_dex: 8,
  z_dnd_con: 8,
  z_dnd_int: 8,
  z_dnd_wis: 8,
  z_dnd_cha: 8,
});

/**
 * Build vault-relative destination paths for a character.
 *
 * @param {string} name - Character name
 * @returns {Readonly<Record<string, string>>}
 */
const buildPaths = (name) => Object.freeze({
  dashboard: `${PARTY_DIR}MyCampaign - ${name}.md`,
  notes: `${CHAR_INFO_DIR}/MyCampaign - ${name} - Notes.md`,
  data: `${CHAR_INFO_DIR}/MyCampaign - ${name} - Data.md`,
});

/**
 * Check whether any file for this character name already exists.
 *
 * @param {string} name - Character name
 * @returns {boolean}
 */
const characterExists = (name) =>
  Object.values(buildPaths(name)).some(
    (p) => app.vault.getAbstractFileByPath(p) !== null
  );

/**
 * Check whether a string is a valid Obsidian filename.
 *
 * @param {string} name
 * @returns {boolean}
 */
const isValidName = (name) =>
  name.length > 0 && name.length <= MAX_NAME_LENGTH && !UNSAFE_CHARS.test(name);

/**
 * Why this character name cannot be used, or null when it can.
 *
 * The empty case comes first on purpose: isValidName already rejects a
 * zero-length name, and would report it as bad characters.
 *
 * @param {string} name - Trimmed character name
 * @returns {{title: string, content: string}|null}
 */
const nameProblem = (name) => {
  if (name === "") {
    return {
      title: "No Name Entered",
      content: "Enter a name for the character.",
    };
  }

  if (!isValidName(name)) {
    return {
      title: "Invalid Name",
      content: `"${name}" is invalid.\n\nNames must be ${MAX_NAME_LENGTH} characters or fewer.\nAvoid: \\ / : * ? " < > | # \` [ ] { }`,
    };
  }

  if (characterExists(name)) {
    return {
      title: "Name Already Exists",
      content: `"${name}" already exists. Choose a different name.`,
    };
  }

  return null;
};

/**
 * Prompt the user for a usable character name using JS Engine's modal API.
 * Names the problem and asks again. Returns null if the user cancels the
 * text prompt or declines the retry.
 *
 * @returns {Promise<string|null>}
 */
const promptForName = async () => {
  while (true) {
    const raw = await engine.prompt.text({
      title: "New Player Character",
      content: "Enter the character's name:",
      placeholder: "Character Name",
    });

    if (raw === undefined || raw === null) return null;

    const name = raw.trim();
    const problem = nameProblem(name);
    if (!problem) return name;

    const retry = await engine.prompt.confirm({
      title: problem.title,
      content: `${problem.content}\n\nPress Confirm to try again, or Cancel to stop.`,
    });

    if (!retry) return null;
  }
};

/**
 * Read a template file, replace the token with the character name,
 * and write the result to a new path.
 *
 * @param {string} templatePath - Vault-relative path to the template
 * @param {string} destPath - Vault-relative path for the new file
 * @param {string} name - Character name to substitute for TOKEN
 * @returns {Promise<import('obsidian').TFile>} The created file
 */
const duplicateTemplate = async (templatePath, destPath, name) => {
  const templateFile = app.vault.getAbstractFileByPath(templatePath);
  if (!templateFile) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const content = await app.vault.read(templateFile);
  return app.vault.create(destPath, content.replaceAll(TOKEN, name));
};

/**
 * Clear the inherited template ID from a file's frontmatter
 * and optionally merge in additional default values.
 *
 * @param {import('obsidian').TFile} file
 * @param {Record<string, *>} [defaults={}] - Key-value pairs to set
 * @returns {Promise<void>}
 */
const initFrontmatter = (file, defaults = {}) =>
  app.fileManager.processFrontMatter(file, (fm) => {
    delete fm.id;
    Object.entries(defaults).forEach(([key, value]) => {
      fm[key] = Array.isArray(value) ? [...value] : value;
    });
  });


// ----
// Main
// ----

let name;
try {
  name = await promptForName();
  if (!name) return;

  const dest = buildPaths(name);
  const dashboard = await duplicateTemplate(TEMPLATES.dashboard, dest.dashboard, name);
  const notes = await duplicateTemplate(TEMPLATES.notes, dest.notes, name);
  const data = await duplicateTemplate(TEMPLATES.data, dest.data, name);

  await initFrontmatter(dashboard);
  await initFrontmatter(notes);
  await initFrontmatter(data, {
    z_dnd_name: name,
    ...DATA_DEFAULTS,
  });

  new Notice(`${name} was successfully created.`);
} catch (e) {
  console.error("create-character:", e);
  new Notice(`Error creating ${name ?? "character"}: ${e.message}`);
}
