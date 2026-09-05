# 5e Character Sheets — Setup

The following installation serves as a master copy of templates for referencing
basic Player Character stats in a 5e party. Follow the instructions below to
get started.


## Step 1: Install Plugins (Once)

You need two community plugins for Obsidian:

1. **Meta Bind** — enables inline data entry fields and the buttons
   - Settings --> Community plugins --> Browse --> search "Meta Bind" -->
     Install --> Enable
2. **JS Engine** — runs the setup and character creation scripts
   - Settings --> Community plugins --> Browse --> search "JS Engine" -->
     Install --> Enable
   - Settings --> Community plugins --> **Meta Bind** --> scroll to the
     **JavaScript** section --> enable **Enable JS**

> The macro buttons in this project need JS Engine and **Enable JS**.


## Step 2: Install Character Sheets (For Every Campaign)

Click the button below. It will ask for your **campaign name** and
**install location**, then copy everything into place.

```meta-bind-button
label: "Install Character Sheets"
icon: "download"
style: primary
actions:
  - type: inlineJS
    code: |
      const here = app.vault.getAbstractFileByPath(context.file.path);
      const root = here.parent.path;
      const dir = root === "/" || root === "" ? "" : `${root}/`;
      const src = await app.vault.adapter.read(`${dir}setup.js`);
      const run = new Function("app", "engine", "context", "Notice",
        `return (async () => {\n${src}\n})();`);
      await run(app, engine, { ...context, file: here }, Notice);
```

## Step 3: Enable CSS Snippet (Once)

After installation, enable the CSS snippet:
- Settings --> Appearance --> scroll to **CSS Snippets** --> toggle on **dnd-sheet**

This hides internal data properties and makes dashboards look clean.


## Done!

Open the **Instructions** file in your install location to learn how to add and manage characters.
