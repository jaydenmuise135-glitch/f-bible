export type Testament = "OT" | "NT";

export type BibleBook = {
  id: string;
  name: string;
  abbrev: string;
  testament: Testament;
  group: string;
  chapters: string[][];
};

export type ReadingState = {
  bookIndex: number;
  chapter: number;
};

export type SearchHit = {
  bookIndex: number;
  chapter: number;
  verse: number;
  text: string;
};

export type ParsedReference = {
  bookIndex: number;
  chapter: number;
  verse?: number;
};

export type Palette = "amber" | "phosphor" | "ice" | "magenta" | "paper" | "mono";

export type VerseLayout = "flow" | "stacked";

export type FontKind = "mono" | "typewriter" | "serif" | "sans" | "custom";

export type FontOption = {
  id: string;
  label: string;
  stack: string;
  kind: FontKind;
};

export type CustomFont = {
  family: string;
  fileName: string;
  dataUrl: string;
  size: number;
};

export type Settings = {
  palette: Palette;
  fontId: string;
  applyFontToUi: boolean;
  fontSize: number;
  lineHeight: number;
  measure: number;
  verseNumbers: boolean;
  verseLayout: VerseLayout;
  justify: boolean;
  scanlines: boolean;
  cursor: boolean;
  hints: boolean;
};
