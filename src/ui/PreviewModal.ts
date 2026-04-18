import { App, Component, MarkdownRenderer, Modal, Notice } from "obsidian";
import type PageConPlugin from "../main";
import { fetchAndConvert } from "../utils/converter";
import type { ConvertResult } from "../types";

export class PreviewModal extends Modal {
  private readonly plugin: PageConPlugin;
  private readonly url: string;
  private readonly onInsert: (result: ConvertResult) => void;
  private readonly component: Component;

  constructor(
    app: App,
    plugin: PageConPlugin,
    url: string,
    onInsert: (result: ConvertResult) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.url = url;
    this.onInsert = onInsert;
    this.component = new Component();
  }

  async onOpen(): Promise<void> {
    const { contentEl, modalEl } = this;
    modalEl.addClass("page-con-preview-modal");

    // Loading state
    const loadingEl = contentEl.createEl("p", {
      text: "Fetching page…",
      cls: "page-con-loading",
    });

    let result: ConvertResult;

    try {
      result = await fetchAndConvert(this.url, this.plugin.settings);
    } catch (err) {
      loadingEl.remove();
      const message = err instanceof Error ? err.message : String(err);
      contentEl.createEl("p", { text: `Failed: ${message}`, cls: "page-con-error" });
      contentEl
        .createEl("button", { text: "Close" })
        .addEventListener("click", () => this.close());
      new Notice(`PageCon preview: ${message}`);
      return;
    }

    loadingEl.remove();

    // Header
    contentEl.createEl("h2", {
      text: result.title || this.url,
      cls: "page-con-preview-title",
    });

    // Rendered Markdown preview
    const previewEl = contentEl.createDiv({ cls: "page-con-preview" });
    await MarkdownRenderer.render(
      this.app,
      result.markdown,
      previewEl,
      this.url,
      this.component
    );

    // Button row
    const buttonRow = contentEl.createDiv({ cls: "page-con-buttons" });

    const insertBtn = buttonRow.createEl("button", {
      text: "Insert into note",
      cls: "mod-cta",
    });
    insertBtn.addEventListener("click", () => {
      this.onInsert(result);
      this.close();
    });

    buttonRow
      .createEl("button", { text: "Cancel" })
      .addEventListener("click", () => this.close());
  }

  onClose(): void {
    this.component.unload();
    this.contentEl.empty();
  }
}
