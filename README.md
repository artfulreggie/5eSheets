<a id="readme-top"></a>

# 5e Sheets


## 🗄️ Table of Contents
- [About](#-about)
- [Installation](#-installation)
- [What's New?](#-whats-new)
- [Feedback and Contributions](#-feedback-and-contributions)
- [License](#-license)
- [Contacts](#-contacts)


## 👓 About

This is a collection of templated files for creating a set of dashboards for
your campaign's player characters.

Controls exist for quickly creating new campaign parties and new characters
within those parties. Once there you can enter basic ability scores and class
info about the PCs to have skills modifiers and other depedent stats calculated
for you.

PC notes have placeholders for history and identity information that will
display in their respective dashboards. Arrange a combination of these screens
so you can have a quick summary of info for better GMing or just refreshing your
memory before sessions.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## 📦 Installation

### Quick Install

1. Download and unzip.
2. Copy the contents of the `src` folder into your Obsidian vault, wherever you
   like.
3. Open the note `Setup` inside it.
4. Follow the instructions:
  1. Install and enable **Meta Bind** and **JS Engine**
  2. **Enable JS** in Meta Bind's settings.
5. Select **Install Character Sheets** to create a set of sheets for a new
   campaign.
6. Under Obsidian's Settings --> Appearance --> CSS Snippets, enable the
  `dnd-sheet`.

### Development Install

#### Pre-Requisites
- [Node](https://nodejs.org) (22.0 minimum)
- [Make](https://gnuwin32.sourceforge.net/packages/make.htm)
  (if you're on Windows.)

#### Installation

1. Clone this repository
2. Run:

```sh
make setup                       # once, to enable the git hooks
make install VAULT=/path/to/vault
```

`make install` checks for previous installation, then copies `src/` to
`<vault>/5e Sheets`. To preview what install would do, use
`make install-dry` which lists every file and marks which ones already exist.

Two keys under `install` in `config.json` control where that goes:

| key | default | what it does |
| --- | --- | --- |
| `vaultDir` | `""` | Absolute path to your vault. |
| `vaultSubdir` | `"5e Sheets"` | Folder inside the vault to install to. |

`config.json` is tracked. Please store your own settings in `config.local.json`

EG:
```json
{ "install": { "vaultDir": "~/Obsidian/Personal" } }
```

Run `make help` for more info.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## ✨ What's New?

### Version 1.0 (Latest)

🚀 **Features**
- **Campaign Creation**: Clone files for new campaigns and parties.
- **Character Creation and Deletion**: Clone files within a campaign for new
  PCs.
- **Party Dashboard**: Quickly glance at ability and skill modifiers for the
  whole party.
- **Character Dashboards**: Summary dashboards of PCs including their stats
  and identity notes.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## 🤝 Feedback and Contributions

This is a very basic little project and set of scripts with limited scope that
I intend to be _very_ easy to install and use. I don't play 5e often enough so
there might be bugs or ill-thought design decisions.

Please feel free to contribute by
[submitting an issue](https://github.com/artfulreggie/5eSheets/issues/new) or
[contacting me](#-contacts).

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## 📃 License

This product is distributed under the open source
[MIT License](https://opensource.org/license/mit). See
📋[License Agreement](LICENSE.txt) for details.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## 💬 Contacts

For more details about this project, questions, concerns or ideas, feel free to
reach out. I'm available via:
- **Email**: [artfulreggie AT gmail DOT com](mailto:artfulreggie+git+5eSheets@gmail.com)
- **Telegram**: @artfulreggie

<p align="right">(<a href="#readme-top">back to top</a>)</p>
