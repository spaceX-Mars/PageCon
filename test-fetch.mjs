/**
 * test-fetch.mjs
 * Run: node test-fetch.mjs [url]
 *
 * Simulates the full pageCon pipeline outside Obsidian so we can see
 * exactly which stage fails. Uses jsdom instead of DOMParser.
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const URL_ARG =
  process.argv[2] ?? "https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin";

const AD_SELECTORS = [
  "ins.adsbygoogle", "[id*='google_ads']", "[id*='google-ad']",
  "[class*='advertisement']", "[id*='advertisement']",
  "[class*='advert']", "[id*='advert']",
  "[class^='ad-']", "[class*='-ad-']", "[class$='-ad']",
  "[id^='ad-']", "[id*='-ad-']", "[id$='-ad']",
  ".ad", ".ads", "#ad", "#ads",
  "[class*='sponsor']", "[id*='sponsor']",
  "[class*='promoted']", "[id*='promoted']",
  "[class*='popup']", "[id*='popup']",
  "[class*='cookie-banner']", "[class*='cookie-consent']", "[class*='gdpr']",
  "[class*='newsletter-signup']", "[class*='subscribe-banner']",
  "iframe",
];

const CONTENT_SELECTORS = [
  "article.vp-doc", ".vp-doc",
  ".theme-doc-markdown", ".markdown",
  ".md-content", "article[role='main']",
  "article", "main", "[role='main']",
  ".post-content", ".entry-content",
  ".content", "#content", ".post", ".article",
];

// ─── 1. Fetch ────────────────────────────────────────────────────────────────

console.log("\n── STEP 1: Fetch ────────────────────────────────────────");
console.log("URL:", URL_ARG);

const res = await fetch(URL_ARG, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  },
});

console.log("HTTP status:", res.status, res.statusText);
console.log("Content-Type:", res.headers.get("content-type"));

if (!res.ok) {
  console.error("❌ Request failed — stopping.");
  process.exit(1);
}

const html = await res.text();
console.log("Raw HTML bytes:", html.length);
console.log("First 300 chars of HTML:\n", html.slice(0, 300));

// ─── 2. Parse DOM ────────────────────────────────────────────────────────────

console.log("\n── STEP 2: Parse DOM ────────────────────────────────────");
const dom = new JSDOM(html, { url: URL_ARG });
const doc = dom.window.document;

console.log("Page <title>:", doc.querySelector("title")?.textContent?.trim());
console.log("<body> exists:", !!doc.body);
console.log("<body> innerHTML length:", doc.body?.innerHTML?.length ?? 0);

// ─── 3. Remove ads ───────────────────────────────────────────────────────────

console.log("\n── STEP 3: Remove ads ───────────────────────────────────");
let adsRemoved = 0;
for (const sel of AD_SELECTORS) {
  try {
    doc.querySelectorAll(sel).forEach(el => { el.remove(); adsRemoved++; });
  } catch { /* ignore bad selector */ }
}
console.log("Elements removed by ad selectors:", adsRemoved);

// ─── 4. Readability ──────────────────────────────────────────────────────────

console.log("\n── STEP 4: Readability ──────────────────────────────────");

let readabilityResult = null;
try {
  const clone = doc.cloneNode(true);
  const base = clone.createElement("base");
  base.href = URL_ARG;
  clone.head?.prepend(base);

  const reader = new Readability(clone);
  const article = reader.parse();

  if (!article) {
    console.log("⚠️  Readability returned null");
  } else {
    readabilityResult = article;
    console.log("✅ Readability OK");
    console.log("  title:", article.title);
    console.log("  content HTML length:", article.content?.length ?? 0);
    console.log("  textContent length:", article.textContent?.length ?? 0);
    console.log("  content preview (first 500 chars):\n   ", article.content?.slice(0, 500));
  }
} catch (err) {
  console.error("❌ Readability threw:", err.message);
}

// ─── 5. Fallback content selector ───────────────────────────────────────────

let contentHtml = "";
let title = "";

if (readabilityResult) {
  title = readabilityResult.title;
  contentHtml = readabilityResult.content;
} else {
  console.log("\n── STEP 4b: Fallback content selector ───────────────────");
  title = doc.querySelector("title")?.textContent?.trim() ?? "";

  for (const tag of ["script", "style", "nav", "header", "footer", "aside", "noscript"]) {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  }

  let contentEl = doc.body;
  for (const sel of CONTENT_SELECTORS) {
    const candidate = doc.querySelector(sel);
    if (candidate) {
      console.log("  Using selector:", sel);
      contentEl = candidate;
      break;
    }
  }
  if (!contentEl) {
    console.error("❌ doc.body is null — cannot extract.");
    process.exit(1);
  }
  contentHtml = contentEl.innerHTML;
  console.log("  Fallback innerHTML length:", contentHtml.length);
}

// ─── 6. Turndown ─────────────────────────────────────────────────────────────

console.log("\n── STEP 5: Turndown ─────────────────────────────────────");

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  hr: "---",
});

let markdown = td.turndown(contentHtml);
console.log("Markdown length:", markdown.length);

if (!markdown.trim() && readabilityResult) {
  markdown = readabilityResult.textContent?.trim() ?? "";
  console.log("⚠️  Markdown empty — using textContent fallback, length:", markdown.length);
}

// ─── 7. Result ───────────────────────────────────────────────────────────────

console.log("\n── RESULT ───────────────────────────────────────────────");
console.log("Title:", title);
console.log("Markdown length:", markdown.length);
if (markdown.length > 0) {
  console.log("\nFirst 1000 chars of output markdown:\n");
  console.log(markdown.slice(0, 1000));
  console.log("\n✅ Content extracted successfully.");
} else {
  console.log("❌ Markdown is empty — no content extracted.");
}
