import { useEffect, useMemo, useRef, useState } from "react";
import { BOOKS, CHAPTER_COUNT } from "../data/bible";
import type { BibleBook } from "../types";

type Group = { label: string; books: { book: BibleBook; index: number }[] };

function groupBooks(): Group[] {
  const groups: Group[] = [];
  BOOKS.forEach((book, index) => {
    const label = `${book.testament === "OT" ? "Old" : "New"} · ${book.group}`;
    const existing = groups.find((group) => group.label === label);
    if (existing) existing.books.push({ book, index });
    else groups.push({ label, books: [{ book, index }] });
  });
  return groups;
}

const GROUPS = groupBooks();

export function IndexPanel({
  bookIndex,
  chapter,
  onSelect,
  onClose,
}: {
  bookIndex: number;
  chapter: number;
  onSelect: (bookIndex: number, chapter: number) => void;
  onClose?: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(bookIndex);
  const activeRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);

  useEffect(() => {
    setExpanded(bookIndex);
  }, [bookIndex]);

  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    const timer = window.setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: "center" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  const needle = filter.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        books: group.books.filter(({ book }) => book.name.toLowerCase().includes(needle)),
      })).filter((group) => group.books.length > 0),
    [needle]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--line)] px-2.5">
        <span className="text-[var(--accent)]">▤</span>
        <span className="label !text-[var(--text-dim)]">Books</span>
        <span className="tag ml-auto">66</span>
        <span className="tag hidden sm:inline">{CHAPTER_COUNT}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close index"
            className="flex h-5 w-5 items-center justify-center text-[var(--muted)] hover:text-[var(--accent)]"
          >
            ✕
          </button>
        )}
      </div>

      <div className="shrink-0 border-b border-[var(--line)] p-2">
        <label className="input h-7">
          <span className="text-[var(--accent)]">/</span>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="filter books"
            aria-label="Filter books"
            className="!text-[11px]"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              aria-label="Clear filter"
              className="text-[var(--faint)] hover:text-[var(--text)]"
            >
              ✕
            </button>
          )}
        </label>
      </div>

      <div className="scroll-term min-h-0 flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="label">no book found</p>
            <p className="mt-1.5 text-[10px] text-[var(--faint)]">try “john” or “psalm”</p>
          </div>
        )}
        {filtered.map((group) => (
          <div key={group.label}>
            <div className="index-heading">{group.label}</div>
            {group.books.map(({ book, index }) => {
              const active = index === bookIndex;
              const isOpen = expanded === index && active;
              return (
                <div key={book.id} ref={active ? activeRef : null}>
                  <button
                    type="button"
                    className="book-row"
                    data-active={active}
                    onClick={() => {
                      if (active) {
                        setExpanded(isOpen ? null : index);
                      } else {
                        setExpanded(index);
                        onSelect(index, 1);
                      }
                    }}
                    title={`${book.name} · ${book.chapters.length} chapters`}
                  >
                    <span className="book-num">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate">{book.name}</span>
                    {active ? (
                      <span className="text-[var(--accent)]">▌</span>
                    ) : (
                      <span className="text-[8.5px] tabular-nums text-[var(--faint)]">{book.chapters.length}</span>
                    )}
                  </button>
                  {isOpen && (
                    <div className="chapter-grid">
                      {book.chapters.map((_, chapterIdx) => (
                        <button
                          key={chapterIdx}
                          type="button"
                          className="chapter-cell"
                          data-active={chapterIdx + 1 === chapter}
                          onClick={() => onSelect(index, chapterIdx + 1)}
                          aria-label={`${book.name} chapter ${chapterIdx + 1}`}
                          aria-current={chapterIdx + 1 === chapter ? "page" : undefined}
                        >
                          {chapterIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[var(--line)] px-2.5 py-2">
        <p className="flex items-center justify-between text-[8.5px] uppercase tracking-[0.1em] text-[var(--faint)]">
          <span>{BOOKS.length} books</span>
          <span>66 · 1,189 · 31,102</span>
        </p>
      </div>
    </div>
  );
}

