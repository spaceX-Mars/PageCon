# PageCon

> Paste a URL. Get clean Markdown. Stay in your flow.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7c3aed)](https://obsidian.md)

**PageCon** is an Obsidian plugin that turns any web page into clean, readable Markdown — right inside your note. No browser switching, no copy-paste mess, no ads or cookie banners cluttering the output.

---

## How it works

1. Put your cursor on a URL (or select one) in any note
2. Hit `Ctrl/Cmd + P` and pick a command

| Command | What happens |
|---|---|
| **Fetch URL → paste as Markdown** | Grabs the page and inserts it instantly |
| **Preview URL as Markdown** | Shows a preview first — insert when ready |

PageCon finds the main article on the page, strips the noise, and pastes formatted Markdown with the page title as a heading.

---

## What gets cleaned up automatically

- Ads and sponsored content
- Cookie consent and GDPR banners
- Newsletter popups and subscribe nag bars
- Social share buttons
- Comment sections
- Page navigation, headers, and footers *(when Strip chrome is on)*

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Include images | On | Keep or drop image links in the output |
| Strip page chrome | On | Remove nav, header, footer, and sidebars |
| Separator | `---` | Divider inserted before the pasted content |

---

## Installation

**Community plugins browser** *(recommended)*
1. Open **Settings → Community plugins → Browse**
2. Search **PageCon** → Install → Enable

**Manual**
Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/spaceX-Mars/PageCon/releases) and copy them to `<vault>/.obsidian/plugins/page-con/`.

---

## Privacy & Security

- **Nothing leaves your device** except a single `GET` request to the URL you provide — no analytics, no telemetry, no third-party servers
- **Scripts are always stripped** from fetched pages before any content reaches your note
- **Only `https://` and `http://` URLs** are accepted — no local file access
- All settings are stored locally in your vault

---

## Known limitations

- JavaScript-heavy pages (SPAs) may return little content — PageCon only processes the static HTML
- Pages behind login or aggressive bot-detection (e.g. Cloudflare) may fail

---

## License

MIT — see [LICENSE](LICENSE)
