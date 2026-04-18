import { App, PluginSettingTab, Setting } from "obsidian";
import type PageConPlugin from "./main";
import type { PageConSettings } from "./types";

export const DEFAULT_SETTINGS: PageConSettings = {
  includeImages: true,
  stripChrome: true,
  separator: "\n\n---\n\n",
};

export class PageConSettingTab extends PluginSettingTab {
  plugin: PageConPlugin;

  constructor(app: App, plugin: PageConPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PageCon settings" });

    new Setting(containerEl)
      .setName("Include images")
      .setDesc("Keep image links from the fetched page in the Markdown output.")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.includeImages)
          .onChange(async value => {
            this.plugin.settings.includeImages = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Strip page chrome")
      .setDesc(
        "Remove navigation, header, footer, and sidebar elements before converting."
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.stripChrome)
          .onChange(async value => {
            this.plugin.settings.stripChrome = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Separator")
      .setDesc("Text inserted between the URL and the converted content.")
      .addText(text =>
        text
          .setPlaceholder("\\n\\n---\\n\\n")
          .setValue(this.plugin.settings.separator)
          .onChange(async value => {
            this.plugin.settings.separator = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
