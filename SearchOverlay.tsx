import { useEffect, useMemo, useRef, useState } from "react";
import { BOOKS, formatReference, parseReference, searchBible } from "../data/bible";
import { SEARCH_SUGGESTIONS } from "../data/preferences";
import { HighlightMatch, Overlay } from "./Overlay";
import { cn } from "../utils/cn";

export function SearchOverlay({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (bookIndex: number, chapter: number, verse?: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const needle = query.trim();
  const parsed = useMemo(() => parseReference(needle), [needle]);
  const { hits, total } = useMemo(() => searchBible(needle, 60), [needle]);

  useEffect(() => {
    setActiveIndex(0);
  }, [needle]);

  const jumpToReference = () => {
    if (!parsed) return;
    onNavigate(parsed.bookIndex, parsed.chapter, parsed.verse ?? null);
    onClose();
  };

  const jumpToHit = (index: number) => {
    const hit = hits[index];
    if (!hit) return;
    onNavigate(hit.bookIndex, hit.chapter, hit.verse);
    onClose();
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title="Search"
      meta={`${total.toLocaleString()} matches`}
      width="max-w-[740px]"
      footer={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] uppercase tracking-[0.1em] text-[var(--faint)]">
          <span className="flex items-center gap-1.5">
            <span className="key">↑</span>
            <span className="key">↓</span> select
          </span>
          <span className="flex items-center gap-1.5">
            <span className="key">enter</span> open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="key">esc</span> close
          </span>
          <span className="ml-auto hidden sm:inline">tip: type a reference like john 3:16</span>
        </div>
      }
    >
      <div className="border-b border-[var(--line)] p-2.5">
        <div className="flex h-10 items-center gap-2 border border-[var(--accent-dim)] bg-[var(--bg-deep)] px-2.5">
          <span className="term-cursor text-[14px]">▌</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(hits.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (activeIndex > 0) jumpToHit(activeIndex);
                else if (parsed) jumpToReference();
                else jumpToHit(0);
              }
            }}
            placeholder="search a word, phrase, or reference…"
            aria-label="Search the King James Bible"
            className="h-full flex-1 bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
            spellCheck={false}
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="text-[var(--faint)] hover:text-[var(--accent)]"
            >
              ✕
            </button>
          ) : (
            <span className="tag hidden sm:inline">KJV</span>
          )}
        </div>
      </div>

      <div>
        {needle.length < 2 ? (
          <div className="p-4">
            <p className="label">Search the whole Bible</p>
            <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-[var(--muted)]">
              31,102 verses, 1,189 chapters, 66 books. Search by word or phrase, or jump
              straight to a reference.
            </p>
            <div className="mt-4">
              <p className="label !text-[8px] text-[var(--faint)]">Try a word</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 text-[14px] text-[var(--text-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 border-t border-[var(--line)] pt-3">
              <span className="text-[var(--accent)]">›</span>
              <p className="text-[14px] leading-relaxed text-[var(--faint)]">
                References work too — e.g. <span className="text-[var(--text-dim)]">john 3:16</span>,{" "}
                <span className="text-[var(--text-dim)]">1 cor 13</span>,{" "}
                <span className="text-[var(--text-dim)]">psalm 23</span>.
              </p>
            </div>
          </div>
        ) : (
          <>
            {parsed && (
              <button
                type="button"
                onClick={jumpToReference}
                className="flex w-full items-center gap-2 border-b border-[var(--accent-dim)] bg-[var(--accent-soft)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--panel-3)]"
              >
                <span className="label !text-[8px] text-[var(--accent)]">jump to</span>
                <span className="text-[14px] font-medium uppercase tracking-[0.06em] text-[var(--accent)]">
                  {formatReference(parsed.bookIndex, parsed.chapter, parsed.verse)}
                </span>
                <span className="ml-auto hidden text-[14px] uppercase tracking-[0.08em] text-[var(--muted)] sm:inline">
                  {BOOKS[parsed.bookIndex].name} · {BOOKS[parsed.bookIndex].chapters.length} chapters
                </span>
                <span className="key">↵</span>
              </button>
            )}

            {hits.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[14px] uppercase tracking-[0.12em] text-[var(--text-dim)]">No verses found</p>
                <p className="mt-1.5 text-[11.5px] text-[var(--faint)]">
                  Try a shorter word or check the spelling.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--panel-2)] px-3 py-1.5">
                  <span className="label !text-[8px]">
                    {total > hits.length
                      ? `showing ${hits.length} of ${total.toLocaleString()} matches`
                      : `${total.toLocaleString()} ${total === 1 ? "match" : "matches"}`}
                  </span>
                  <span className="label !text-[8px] text-[var(--faint)]">old → new testament</span>
                </div>
                <div>
                  {hits.map((hit, index) => {
                    const book = BOOKS[hit.bookIndex];
                    return (
                      <button
                        key={`${hit.bookIndex}-${hit.chapter}-${hit.verse}`}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => jumpToHit(index)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-[var(--line)] px-3 py-2 text-left transition-colors",
                          activeIndex === index ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--panel-2)]"
                        )}
                      >
                        <span className="w-[76px] shrink-0 pt-0.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-[var(--accent)] sm:w-[92px]">
                          {book.abbrev} {hit.chapter}:{hit.verse}
                        </span>
                        <span className="min-w-0 flex-1 text-[14px] leading-relaxed text-[var(--text-dim)]"
                          style={{ fontFamily: "var(--reading-font)" }}>
                          <HighlightMatch text={hit.text} query={needle} />
                        </span>
                        <span className="hidden shrink-0 pt-0.5 text-[14px] text-[var(--faint)] sm:inline">
                          {book.name}
                        </span>
                      </button>
                    );
                  })}
                  {total > hits.length && (
                    <p className="px-3 py-2 text-[14px] uppercase tracking-[0.08em] text-[var(--faint)]">
                      refine your search to see more specific verses
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Overlay>
  );
}
