import { useEffect, useMemo, useRef, useState } from "react";
import { BOOKS, formatReference, parseReference } from "../data/bible";
import { QUICK_REFERENCES } from "../data/preferences";
import { Overlay } from "./Overlay";

export function GoToOverlay({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (bookIndex: number, chapter: number, verse?: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseReference(query), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const go = () => {
    if (!parsed) return;
    onNavigate(parsed.bookIndex, parsed.chapter, parsed.verse ?? null);
    onClose();
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title="Go to reference"
      width="max-w-[560px]"
      footer={
        <p className="flex flex-wrap items-center gap-2 text-[11.5px] uppercase tracking-[0.1em] text-[var(--faint)]">
          <span className="key">enter</span> open
          <span className="mx-1 text-[var(--line-bright)]">/</span>
          <span className="key">esc</span> close
          <span className="ml-auto hidden sm:inline">examples: gen 1 · psalm 23 · 1 cor 13:4 · rev 22</span>
        </p>
      }
    >
      <div className="p-3">
        <div className="flex h-11 items-center gap-2 border border-[var(--accent-dim)] bg-[var(--bg-deep)] px-3">
          <span className="text-[14px] text-[var(--accent)]">›</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                go();
              }
            }}
            placeholder="book chapter:verse  ·  e.g. john 3:16"
            aria-label="Go to a Bible reference"
            className="h-full flex-1 bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" onClick={go} disabled={!parsed} className="btn btn-accent btn-sm">
            open
          </button>
        </div>

        <div className="mt-2.5 flex min-h-[34px] items-center gap-2 border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-1.5">
          {parsed ? (
            <>
              <span className="label !text-[8px] text-[var(--accent)]">
                {parsed.verse ? "verse" : "chapter"}
              </span>
              <span className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text)]">
                {formatReference(parsed.bookIndex, parsed.chapter, parsed.verse)}
              </span>
              <span className="ml-auto text-[14px] uppercase tracking-[0.08em] text-[var(--muted)]">
                {BOOKS[parsed.bookIndex].testament === "OT" ? "old testament" : "new testament"} ·{" "}
                {BOOKS[parsed.bookIndex].group}
              </span>
            </>
          ) : (
            <span className="text-[11.5px] text-[var(--muted)]">
              {query.trim()
                ? "No matching book. Try a full name or abbreviation."
                : "Enter any book, chapter, or verse."}
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className="label !text-[8px] text-[var(--faint)]">quick jumps</p>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {QUICK_REFERENCES.map((reference) => (
              <button
                key={reference.value}
                type="button"
                className="border border-[var(--line)] bg-[var(--panel-2)] px-2 py-2 text-left text-[11.5px] text-[var(--text-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                onClick={() => {
                  const next = parseReference(reference.value);
                  if (!next) return;
                  onNavigate(next.bookIndex, next.chapter, next.verse ?? null);
                  onClose();
                }}
              >
                <span className="mr-1 text-[var(--accent)]">↳</span>
                {reference.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Overlay>
  );
}
