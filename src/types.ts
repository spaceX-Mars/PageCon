export interface PageConSettings {
  /** Include images as remote Markdown image links */
  includeImages: boolean;
  /** Strip nav / header / footer / aside elements before conversion */
  stripChrome: boolean;
  /** Separator inserted between the URL and the converted content */
  separator: string;
}

export interface ConvertResult {
  title: string;
  markdown: string;
}
