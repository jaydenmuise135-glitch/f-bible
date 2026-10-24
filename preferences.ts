import type { CustomFont, FontOption, Palette, Settings } from "../types";

export const UI_FONT_STACK =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const FONTS: FontOption[] = [
  {
    id: "jetbrains",
    label: "JetBrains Mono",
    stack: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    kind: "mono",
  },
  {
    id: "plexmono",
    label: "IBM Plex Mono",
    stack: '"IBM Plex Mono", ui-monospace, monospace',
    kind: "mono",
  },
  {
    id: "fira",
    label: "Fira Code",
    stack: '"Fira Code", ui-monospace, monospace',
    kind: "mono",
  },
  {
    id: "courier",
    label: "Courier Prime",
    stack: '"Courier Prime", "Courier New", ui-monospace, monospace',
    kind: "typewriter",
  },
  {
    id: "plexserif",
    label: "IBM Plex Serif",
    stack: '"IBM Plex Serif", Georgia, "Times New Roman", serif',
    kind: "serif",
  },
  {
    id: "plexsans",
    label: "IBM Plex Sans",
    stack: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    kind: "sans",
  },
];

export const PALETTES: {
  id: Palette;
  label: string;
  accent: string;
  background: string;
  note: string;
}[] = [
  { id: "amber", label: "Amber", accent: "#ff8a3d", background: "#0d0c0a", note: "default" },
  { id: "phosphor", label: "Phosphor", accent: "#7df29b", background: "#07100a", note: "green" },
  { id: "ice", label: "Ice", accent: "#7cc7ff", background: "#091017", note: "cyan" },
  { id: "magenta", label: "Magenta", accent: "#ff83d6", background: "#120a10", note: "hot" },
  { id: "paper", label: "Paper", accent: "#bf5410", background: "#f1eadb", note: "light" },
  { id: "mono", label: "Mono", accent: "#ededed", background: "#101010", note: "gray" },
];

export const DEFAULT_SETTINGS: Settings = {
  palette: "amber",
  fontId: "jetbrains",
  applyFontToUi: false,
  fontSize: 16,
  lineHeight: 1.9,
  measure: 76,
  verseNumbers: true,
  verseLayout: "flow",
  justify: false,
  scanlines: true,
  cursor: true,
  hints: true,
};

export function resolveFontStack(fontId: string, customFont: CustomFont | null): string {
  if (fontId === "custom" && customFont) {
    return `"${customFont.family}", ui-monospace, monospace`;
  }
  return FONTS.find((font) => font.id === fontId)?.stack ?? UI_FONT_STACK;
}

export function fontLabel(fontId: string, customFont: CustomFont | null): string {
  if (fontId === "custom" && customFont) return customFont.fileName;
  return FONTS.find((font) => font.id === fontId)?.label ?? "JetBrains Mono";
}

export const QUICK_REFERENCES = [
  { label: "Genesis 1", value: "genesis 1" },
  { label: "Psalms 23", value: "psalms 23" },
  { label: "Matthew 5", value: "matthew 5" },
  { label: "John 3:16", value: "john 3:16" },
  { label: "Romans 8", value: "romans 8" },
  { label: "Revelation 22", value: "revelation 22" },
];

export const SEARCH_SUGGESTIONS = [
  "love",
  "shepherd",
  "be still",
  "light of the world",
  "fear not",
  "living water",
];
