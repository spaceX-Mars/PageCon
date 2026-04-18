import { requestUrl, htmlToMarkdown } from "obsidian";
import type { PageConSettings, ConvertResult } from "../types";

// ---------------------------------------------------------------------------
// Ad / noise selectors — always removed regardless of settings.
// Applied to the whole document before content extraction.
// ---------------------------------------------------------------------------
const AD_SELECTORS = [
  // Google AdSense / Ad Manager
  "ins.adsbygoogle",
  "[id*='google_ads']", "[id*='google-ad']", "[class*='googl-ad']",

  // Generic advertisement markers
  "[class*='advertisement']", "[id*='advertisement']",
  "[class*='advert']", "[id*='advert']",
  "[aria-label='advertisement' i]", "[data-advertisement]",

  // Short ad class / id patterns
  "[class^='ad-']", "[class*='-ad-']", "[class$='-ad']",
  "[id^='ad-']",   "[id*='-ad-']",   "[id$='-ad']",
  "[class^='ads-']", "[class$='-ads']",
  "[id^='ads-']",  "[id$='-ads']",
  ".ad", ".ads", "#ad", "#ads",

  // Sponsored / promoted content
  "[class*='sponsor']", "[id*='sponsor']",
  "[class*='promoted']", "[id*='promoted']",
  "[class*='promo']",   "[id*='promo']",

  // Sticky banners / popovers / interstitials
  "[class*='popup']", "[id*='popup']",
  "[class*='overlay']", "[id*='overlay']",
  "[class*='sticky-ad']", "[class*='ad-sticky']", "[class*='floating-ad']",

  // Cookie / GDPR consent banners
  "[class*='cookie-banner']", "[id*='cookie-banner']",
  "[class*='cookie-consent']", "[id*='cookie-consent']",
  "[class*='gdpr']", "[id*='gdpr']",
  "[class*='consent-']", "[id*='consent-']",

  // Newsletter / subscription nag bars
  "[class*='newsletter']", "[class*='subscribe-banner']",
  "[class*='email-signup']", "[class*='signup-form']",

  // Social share widgets
  "[class*='social-share']", "[class*='share-bar']", "[class*='share-buttons']",

  // Comment sections
  "#comments", ".comments", "[id*='disqus']", "[class*='disqus']",
];

// ---------------------------------------------------------------------------
// Chrome tags removed when stripChrome setting is on.
// Note: script / noscript are removed unconditionally (see fetchAndConvert).
// ---------------------------------------------------------------------------
const CHROME_TAGS = [
  "style", "nav", "header", "footer",
  "aside", "iframe", "svg",
];

// ---------------------------------------------------------------------------
// CSS selectors tried in order to find the main article body.
// First match wins; falls back to <body> if nothing matches.
// ---------------------------------------------------------------------------
const CONTENT_SELECTORS = [
  // VitePress (Obsidian docs, Vue docs, etc.)
  "article.vp-doc", ".vp-doc",
  // Docusaurus
  ".theme-doc-markdown",
  // MkDocs / Material
  ".md-content",
  // Generic semantic elements
  "article", "main", "[role='main']",
  // Common blog / CMS patterns
  ".post-content", ".entry-content", ".article-content",
  ".content", "#content", ".post", ".article",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchAndConvert(
  url: string,
  settings: PageConSettings
): Promise<ConvertResult> {
  const response = await requestUrl({
    url,
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(response.text, "text/html");

  // Extract title before we mutate the document
  const title = doc.querySelector("title")?.textContent?.trim() ?? "";

  // Pass 1 — remove ads unconditionally
  removeBySelectors(doc, AD_SELECTORS);

  // Pass 1b — remove scripts/noscript unconditionally (security: never execute
  // or pass through remote script content regardless of other settings)
  doc.querySelectorAll("script, noscript").forEach(el => el.remove());

  // Pass 2 — remove chrome (nav/header/footer/scripts) when setting is on
  if (settings.stripChrome) {
    for (const tag of CHROME_TAGS) {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    }
  }

  // Find the best content element
  let contentEl: Element | null = null;
  for (const sel of CONTENT_SELECTORS) {
    const candidate = doc.querySelector(sel);
    if (candidate) {
      contentEl = candidate;
      break;
    }
  }

  if (!contentEl) {
    const body = doc.body;
    if (!body) throw new Error("Page has no <body> — cannot extract content.");
    contentEl = body;
  }

  // Rewrite relative href / src → absolute so links work in Obsidian
  resolveUrls(contentEl, url);

  // Remove decorative heading anchors injected by doc generators
  // (VitePress: <a class="header-anchor">, Docusaurus: <a aria-hidden="true">, etc.)
  // These become ugly [](#section-id) noise in the markdown output.
  removeDecorativeAnchors(contentEl);

  // Drop images if the user disabled them
  if (!settings.includeImages) {
    contentEl.querySelectorAll("img").forEach(img => img.remove());
  }

  // Convert with Obsidian's built-in HTML→Markdown engine
  const raw = htmlToMarkdown(contentEl.outerHTML);

  // Post-process: collapse 3+ consecutive blank lines down to 2
  const markdown = raw.replace(/\n{3,}/g, "\n\n").trim();

  if (!markdown) {
    throw new Error("Conversion produced no text — page may be JavaScript-rendered.");
  }

  return { title, markdown };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function removeBySelectors(doc: Document, selectors: string[]): void {
  for (const sel of selectors) {
    try {
      doc.querySelectorAll(sel).forEach(el => el.remove());
    } catch {
      // Ignore invalid selectors
    }
  }
}

function removeDecorativeAnchors(el: Element): void {
  // Named classes used by common doc generators
  el.querySelectorAll(
    "a.header-anchor, a.anchor, a.anchor-link, a.heading-anchor"
  ).forEach(a => a.remove());

  // aria-hidden anchors inside headings (covers generators that don't use a fixed class)
  el.querySelectorAll("h1 a, h2 a, h3 a, h4 a, h5 a, h6 a").forEach(node => {
    const a = node as HTMLAnchorElement;
    const href = a.getAttribute("href") ?? "";
    const text = a.textContent?.trim() ?? "";
    // Remove if it's a fragment-only link with no meaningful text (e.g. "#", "¶", "§", "")
    if (href.startsWith("#") && (text === "" || /^[#¶§]$/.test(text))) {
      a.remove();
    }
  });
}

function resolveUrls(el: Element, baseUrl: string): void {
  el.querySelectorAll("a[href]").forEach(node => {
    const href = node.getAttribute("href");
    if (href && !href.startsWith("#") && !href.startsWith("mailto:")) {
      try { node.setAttribute("href", new URL(href, baseUrl).href); } catch { /* skip */ }
    }
  });

  el.querySelectorAll("img[src]").forEach(node => {
    const src = node.getAttribute("src");
    if (src) {
      try { node.setAttribute("src", new URL(src, baseUrl).href); } catch { /* skip */ }
    }
  });
}
