# PageCon

**PageCon** is an [Obsidian](https://obsidian.md) plugin that fetches a web page from a URL in your note and pastes its content as clean Markdown — ads, cookie banners, nav bars, and social widgets stripped out.

## Features

- Fetch any `http`/`https` URL and insert the page as Markdown in one command
- Preview the converted Markdown before inserting
- Automatically targets the main article body (supports VitePress, Docusaurus, MkDocs, generic blogs, and more)
- Removes ads, cookie consent banners, newsletter nag bars, social share widgets, and comment sections
- Strips all `<script>` tags unconditionally before conversion
- Rewrites relative links to absolute URLs so they work inside Obsidian
- Cleans up decorative heading anchors (`[](#section-id)` noise) injected by documentation generators

## Installation

### From the Obsidian community plugins list

1. Open **Settings → Community plugins → Browse**
2. Search for **PageCon**
3. Click **Install**, then **Enable**

### Manual install

1. Download `main.js`, `manifest.json`, and `styles.css` (if present) from the [latest release](https://github.com/spaceX-Mars/PageCon/releases)
2. Copy them to `<your vault>/.obsidian/plugins/page-con/`
3. Reload Obsidian and enable the plugin under **Settings → Community plugins**

## Usage

1. Type or paste a URL anywhere in a note (selection is optional — PageCon also scans the current line)
2. Open the command palette (`Ctrl/Cmd + P`) and run one of:

| Command | What it does |
|---|---|
| **Fetch selected URL and paste as Markdown** | Fetches immediately and inserts the content below the cursor |
| **Preview selected URL as Markdown** | Opens a rendered preview; click **Insert into note** to paste |

The inserted block starts with the separator you configured, followed by the page title as a `##` heading, then the converted Markdown.

## Settings

| Setting | Default | Description |
|---|---|---|
| Include images | On | Keep image links from the fetched page in the output |
| Strip page chrome | On | Remove `<nav>`, `<header>`, `<footer>`, `<aside>`, `<iframe>`, and `<style>` tags |
| Separator | `\n\n---\n\n` | Text inserted between your URL line and the fetched content |

## Supported site types

PageCon tries a prioritised list of CSS selectors to find the main content area before falling back to `<body>`:

- **VitePress** — `article.vp-doc`, `.vp-doc` (Obsidian Docs, Vue Docs, etc.)
- **Docusaurus** — `.theme-doc-markdown`
- **MkDocs / Material** — `.md-content`
- **Generic** — `article`, `main`, `[role="main"]`
- **Common CMS / blog patterns** — `.post-content`, `.entry-content`, `.article-content`, `.content`, `#content`

## Limitations

- Pages that require JavaScript to render (SPAs) will produce little or no content — only the static HTML returned by the server is processed
- Pages behind authentication or bot-detection (Cloudflare, etc.) may return an error or an empty result

---

## Security & Privacy

### What leaves your device

The only network request PageCon makes is a single `GET` to the URL you explicitly provide. No analytics, no telemetry, no third-party services are contacted. Your vault content is never read or transmitted.

When the request is made, your IP address is visible to the target server (the same as visiting the page in a browser). The request carries a standard browser `User-Agent` header so that sites do not block it as a bot.

### Script removal

`<script>` and `<noscript>` tags are removed from the fetched document **unconditionally** — before any content extraction, before any user setting is applied. Remote JavaScript from a fetched page can never execute inside Obsidian.

### Content sanitisation pipeline

Every fetched page goes through this sequence before any text reaches your note:

1. **Ad and noise removal** — 40+ CSS selectors strip Google AdSense, cookie consent banners, GDPR overlays, newsletter modals, social share widgets, and comment sections
2. **Script removal** — all `<script>` and `<noscript>` elements are removed (unconditional)
3. **Chrome stripping** (when enabled) — `<nav>`, `<header>`, `<footer>`, `<aside>`, `<iframe>`, and `<style>` are removed
4. **Content targeting** — only the main article element is passed forward; the rest of the DOM is discarded
5. **URL resolution** — relative `href` and `src` attributes are rewritten to absolute URLs
6. **Heading anchor cleanup** — decorative fragment anchors injected by documentation generators are removed
7. **HTML→Markdown conversion** — Obsidian's built-in `htmlToMarkdown` engine converts the sanitised HTML; the Markdown renderer does not execute scripts

### URL handling

- Only `http://` and `https://` URLs are accepted; `file://`, `javascript:`, and other schemes are rejected by the URL extraction regex
- URLs are fetched directly from your machine, not proxied through any server

### Data storage

Settings (image toggle, chrome-strip toggle, separator string) are saved to `.obsidian/plugins/page-con/data.json` in your local vault. No data is stored externally.

### Dependencies

PageCon has a single runtime dependency: the `obsidian` package (Obsidian's own API). It does **not** bundle any third-party HTTP clients, HTML parsers, or conversion libraries — all processing uses APIs built into Obsidian and the Electron renderer.

### Responsible disclosure

If you find a security issue, please open a [GitHub issue](https://github.com/spaceX-Mars/PageCon/issues) or contact the author directly before public disclosure.

---

## Development

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

Copy `main.js` and `manifest.json` to `<your vault>/.obsidian/plugins/page-con/` after building.

## License

MIT — see [LICENSE](LICENSE)
