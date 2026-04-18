import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, PageConSettingTab } from "./settings";
import { registerCommands } from "./commands/index";
import type { PageConSettings } from "./types";

export default class PageConPlugin extends Plugin {
  settings: PageConSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    registerCommands(this);
    this.addSettingTab(new PageConSettingTab(this.app, this));
  }

  onunload(): void {}

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<PageConSettings>
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
