import kjvRaw from "./kjv.json";
import type {
  BibleBook,
  ParsedReference,
  ReadingState,
  SearchHit,
  Testament,
} from "../types";

type RawBook = [string, string[][]];

const RAW = kjvRaw as unknown as RawBook[];

const ABBREVIATIONS = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
  "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
  "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
  "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
];

function groupFor(index: number): string {
  if (index <= 4) return "Law";
  if (index <= 16) return "History";
  if (index <= 21) return "Poetry";
  if (index <= 26) return "Major Prophets";
  if (index <= 38) return "Minor Prophets";
  if (index <= 42) return "Gospels";
  if (index === 43) return "History";
  if (index <= 56) return "Pauline Letters";
  if (index <= 64) return "General Letters";
  return "Apocalypse";
}

export const BOOKS: BibleBook[] = RAW.map(([name, chapters], index) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  abbrev: ABBREVIATIONS[index] ?? name.slice(0, 3).toUpperCase(),
  testament: (index < 39 ? "OT" : "NT") as Testament,
  group: groupFor(index),
  chapters,
}));

export const VERSE_COUNT = BOOKS.reduce(
  (total, book) => total + book.chapters.reduce((count, chapter) => count + chapter.length, 0),
  0
);

export const CHAPTER_COUNT = BOOKS.reduce((total, book) => total + book.chapters.length, 0);

export const OLD_TESTAMENT_END = 38;

export const DEFAULT_READING: ReadingState = { bookIndex: 42, chapter: 1 };

const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const BOOK_ALIASES: Record<string, string> = {
  ge: "genesis",
  gn: "genesis",
  ex: "exodus",
  exod: "exodus",
  dt: "deuteronomy",
  deut: "deuteronomy",
  josh: "joshua",
  judg: "judges",
  ps: "psalms",
  pss: "psalms",
  psalm: "psalms",
  pslam: "psalms",
  pr: "proverbs",
  prov: "proverbs",
  song: "song of solomon",
  songs: "song of solomon",
  sos: "song of solomon",
  songofsongs: "song of solomon",
  canticles: "song of solomon",
  matt: "matthew",
  mt: "matthew",
  mk: "mark",
  lk: "luke",
  jn: "john",
  apocalypse: "revelation",
  revelations: "revelation",
  cor: "1 corinthians",
  thess: "1 thessalonians",
  tim: "1 timothy",
  pet: "1 peter",
  phlm: "philemon",
  phil: "philippians",
  philem: "philemon",
  philip: "philippians",
};

export function findBookIndex(input: string): number {
  const key = compact(input);
  if (!key) return -1;

  const exact = BOOKS.findIndex(
    (book) => compact(book.name) === key || book.abbrev.toLowerCase() === key
  );
  if (exact >= 0) return exact;

  const alias = BOOK_ALIASES[key];
  if (alias) {
    const aliased = BOOKS.findIndex((book) => compact(book.name) === compact(alias));
    if (aliased >= 0) return aliased;
  }

  if (key.length >= 2) {
    const partial = BOOKS.map((book, index) => ({ book, index })).filter(
      ({ book }) =>
        compact(book.name).startsWith(key) || book.abbrev.toLowerCase().startsWith(key)
    );
    if (partial.length === 1) return partial[0].index;

    const startsWithoutDigit = partial.filter(({ book }) => !/^\d/.test(book.name));
    if (startsWithoutDigit.length === 1) return startsWithoutDigit[0].index;
  }

  return -1;
}

export function parseReference(input: string): ParsedReference | null {
  const normalized = input.trim().replace(/\./g, "").replace(/\s+/g, " ").toLowerCase();
  if (!normalized) return null;

  const match = normalized.match(
    /^((?:[1-3]\s*)?[a-z][a-z ]*?)\s*(\d+)?(?:\s*[:.]\s*(\d+))?$/
  );
  if (!match) return null;

  const bookIndex = findBookIndex(match[1]);
  if (bookIndex < 0) return null;

  const chapterCount = BOOKS[bookIndex].chapters.length;
  const chapter = match[2]
    ? Math.min(Math.max(Number.parseInt(match[2], 10), 1), chapterCount)
    : 1;
  const verses = BOOKS[bookIndex].chapters[chapter - 1];
  const verse = match[3]
    ? Math.min(Math.max(Number.parseInt(match[3], 10), 1), verses.length)
    : undefined;

  return { bookIndex, chapter, verse };
}

export function formatReference(bookIndex: number, chapter: number, verse?: number | null) {
  const book = BOOKS[bookIndex];
  if (!book) return "";
  return `${book.name} ${chapter}${verse ? `:${verse}` : ""}`;
}

export function adjacentChapter(
  bookIndex: number,
  chapter: number,
  direction: 1 | -1
): ReadingState | null {
  if (direction === 1) {
    if (chapter < BOOKS[bookIndex].chapters.length) return { bookIndex, chapter: chapter + 1 };
    if (bookIndex < BOOKS.length - 1) return { bookIndex: bookIndex + 1, chapter: 1 };
    return null;
  }
  if (chapter > 1) return { bookIndex, chapter: chapter - 1 };
  if (bookIndex > 0) {
    const previous = bookIndex - 1;
    return { bookIndex: previous, chapter: BOOKS[previous].chapters.length };
  }
  return null;
}

export function clampReading(bookIndex: number, chapter: number): ReadingState {
  const safeBook = Math.min(Math.max(bookIndex, 0), BOOKS.length - 1);
  const chapters = BOOKS[safeBook].chapters.length;
  return { bookIndex: safeBook, chapter: Math.min(Math.max(chapter, 1), chapters) };
}

type SearchEntry = SearchHit & { lower: string };

const SEARCH_INDEX: SearchEntry[] = BOOKS.flatMap((book, bookIndex) =>
  book.chapters.flatMap((verses, chapterIndex) =>
    verses.map((text, verseIndex) => ({
      bookIndex,
      chapter: chapterIndex + 1,
      verse: verseIndex + 1,
      text,
      lower: text.toLowerCase(),
    }))
  )
);

export function searchBible(query: string, limit = 80): { hits: SearchHit[]; total: number } {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return { hits: [], total: 0 };

  const hits: SearchHit[] = [];
  let total = 0;
  for (const entry of SEARCH_INDEX) {
    if (entry.lower.includes(needle)) {
      total += 1;
      if (hits.length < limit) {
        hits.push({
          bookIndex: entry.bookIndex,
          chapter: entry.chapter,
          verse: entry.verse,
          text: entry.text,
        });
      }
    }
  }
  return { hits, total };
}

export function readingMinutes(verses: string[]) {
  const words = verses.reduce((count, verse) => count + verse.split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 220));
}

export { SEARCH_INDEX };
