# Instructions

## Creating New Characters

```meta-bind-button
label: "Add PC"
icon: "user-plus"
style: primary
actions:
  - type: inlineJS
    code: |
      const here = app.vault.getAbstractFileByPath(context.file.path);
      const root = here.parent.path;
      const dir = root === "/" || root === "" ? "" : `${root}/`;
      const src = await app.vault.adapter.read(`${dir}create-character.js`);
      const run = new Function("app", "engine", "context", "Notice",
        `return (async () => {\n${src}\n})();`);
      await run(app, engine, { ...context, file: here }, Notice);
```

## Editing Character Data

### Name, Race, Stats, etc.
Character data is stored in **Character Notes** files found in
`Character Info/<Campaign> - <Name> - Note`.

At the top of these files you will find data entry fields for adding
information about your campaign's characters. You will only need to entry info
for stats that are ordinarily concocted by hand (eg ability scores). Character
info that is derived from these values will be calculated dynamically.

**Do not** edit the **Character Data** files directly. The Notes file is for
data entry. Data files contain front matter properties and act like records in
a database.


### Additional Notes / Backstory
Scroll to the `# Notes` section at the bottom of any **Character Notes** file.
Write whatever you want — backstory, personality, session notes, etc.

You can embed specific sections in the **Character Dashboard** using
[internal embeds](https://obsidian.md/help/embeds).


## Viewing Character Data

### Dashboards
After cloning the original installation files for a new campaign and creating
the campaign's first character, you will notice a set of files:
- `<Campaign> - Party`
- `<Campaign> - <Character Name>`

These are dashboards summarizing and calculating values dynamically from the
**Character Notes** and **Character Data** files.

The first file is a simplified table for the party's abilities and skills. The
second set of files summarize each PC's data at a glance for better RP and
GMing.


## File Guide

| Kind of File | Location | Purpose |
| :--- | :--- | :--- |
| Party Dashboard | `MyCampaign - Party` | Dashboard for the party - basic stats in compact form |
| Character Dashboard | `MyCampaign - <Name>` | Dashboard for a character — pertinent data at a glance |
| Character Notes | `Character Info/MyCampaign - <Name> - Notes` | Character sheet you edit and read |
| Character Data | `Character Info/MyCampaign - <Name> - Data` | Behind-the-scenes data storage (do **not** edit directly) |
| Dashboard Template | `Templates/MyCampaign - CHARACTER TEMPLATE` | Template for new character dashboards |
| Info Templates | `Templates/MyCampaign - CHARACTER TEMPLATE - *` | Templates for new character data and notes |
| Bases (database views) | `Base/MyCampaign - Base - *` | Queryable data tables for party stats |
| Add PC Script | `create-character.js` | JS for the "Add PC" button (requires JS Engine plugin) |
