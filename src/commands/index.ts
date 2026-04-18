import { Editor, EditorPosition, MarkdownView, Notice } from "obsidian";
import type PageConPlugin from "../main";
import { fetchAndConvert } from "../utils/converter";
import { PreviewModal } from "../ui/PreviewModal";
import type { ConvertResult } from "../types";

const URL_RE = /https?:\/\/[^\s\])"'>]+/;

export function registerCommands(plugin: PageConPlugin): void {
  // Direct insert — no preview, fetches and pastes immediately
  plugin.addCommand({
    id: "fetch-url-to-markdown",
    name: "Fetch selected URL and paste as Markdown",
    editorCallback: async (editor: Editor, _view: MarkdownView) => {
      await runFetch(editor, plugin);
    },
  });

  // Preview first, then let the user decide to insert
  plugin.addCommand({
    id: "preview-url-as-markdown",
    name: "Preview selected URL as Markdown",
    editorCallback: async (editor: Editor, _view: MarkdownView) => {
      runPreview(editor, plugin);
    },
  });
}

// ---------------------------------------------------------------------------
// Direct fetch + insert
// ---------------------------------------------------------------------------

async function runFetch(editor: Editor, plugin: PageConPlugin): Promise<void> {
  const url = extractUrl(editor);
  if (!url) {
    new Notice("PageCon: no URL found in selection.");
    return;
  }

  const insertAt = editor.getCursor("to");
  const notice = new Notice("PageCon: fetching…", 0);

  try {
    const result = await fetchAndConvert(url, plugin.settings);
    insertBlock(editor, result, insertAt, plugin);
    notice.hide();
    new Notice(`PageCon: pasted "${result.title || url}"`);
  } catch (err) {
    notice.hide();
    const message = err instanceof Error ? err.message : String(err);
    new Notice(`PageCon: failed — ${message}`);
    console.error("[PageCon] fetch error", err);
  }
}

// ---------------------------------------------------------------------------
// Preview modal → optional insert
// ---------------------------------------------------------------------------

function runPreview(editor: Editor, plugin: PageConPlugin): void {
  const url = extractUrl(editor);
  if (!url) {
    new Notice("PageCon: no URL found in selection.");
    return;
  }

  // Capture cursor position now; user may click elsewhere while the modal is open
  const insertAt = editor.getCursor("to");

  new PreviewModal(plugin.app, plugin, url, (result: ConvertResult) => {
    insertBlock(editor, result, insertAt, plugin);
    new Notice(`PageCon: pasted "${result.title || url}"`);
  }).open();
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function extractUrl(editor: Editor): string | null {
  // 1. Check selected text first
  const selected = editor.getSelection().trim();
  if (selected) {
    const match = URL_RE.exec(selected);
    if (match) return match[0];
  }

  // 2. Fall back to URL anywhere on the current line (cursor just needs to be on it)
  const line = editor.getLine(editor.getCursor().line);
  return URL_RE.exec(line)?.[0] ?? null;
}

function insertBlock(
  editor: Editor,
  result: ConvertResult,
  insertAt: EditorPosition,
  plugin: PageConPlugin
): void {
  const block =
    plugin.settings.separator +
    (result.title ? `## ${result.title}\n\n` : "") +
    result.markdown.trim() +
    "\n";

  editor.replaceRange(block, insertAt);

  const lines = block.split("\n");
  editor.setCursor({
    line: insertAt.line + lines.length - 1,
    ch: lines[lines.length - 1]?.length ?? 0,
  });
}
