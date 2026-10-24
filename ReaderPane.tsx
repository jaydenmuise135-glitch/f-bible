import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BOOKS, formatReference, readingMinutes } from "../data/bible";
import type { Settings } from "../types";

type ReaderPaneProps = {
  bookIndex: number;
  chapter: number;
  selectedVerse: number | null;
  settings: Settings;
  readingFont: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  onSelectVerse: (verse: number | null) => void;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string | null;
  nextLabel: string | null;
  onCopyChapter: () => void;
  onOpenGoTo: () => void;
};

export function ReaderPane({
  bookIndex,
  chapter,
  selectedVerse,
  settings,
  readingFont,
  scrollRef,
  onSelectVerse,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  onCopyChapter,
  onOpenGoTo,
}: ReaderPaneProps) {
  const book = BOOKS[bookIndex];
  const verses = book.chapters[chapter - 1];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookIndex, chapter]);

  const toggleVerse = (verse: number) => {
    onSelectVerse(selectedVerse === verse ? null : verse);
  };

  useEffect(() => {
    if (!selectedVerse) return;
    const element = document.getElementById(`v-${selectedVerse}`);
    if (!element) return;
    const container = scrollRef.current;
    if (!container) return;
    const rect = element.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    if (rect.top < bounds.top + 24 || rect.bottom > bounds.bottom - 24) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVerse]);

  const columnStyle: CSSProperties = {
    fontFamily: readingFont,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto w-full max-w-[calc(var(--measure,76ch)+8rem)] px-4 pb-3 pt-3 sm:px-8 sm:pb-4 sm:pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="meta-row min-w-0">
              <span className="text-[var(--accent)]">
                {book.testament === "OT" ? "OLD TESTAMENT" : "NEW TESTAMENT"}
              </span>
              <span className="text-[var(--line-bright)]">/</span>
              <span className="hidden truncate sm:inline">{book.group}</span>
              <span className="hidden text-[var(--line-bright)] sm:inline">/</span>
              <span className="text-[var(--text-dim)]">KJV</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="icon-btn !h-6 !w-6"
                onClick={onPrev}
                disabled={!prevLabel}
                aria-label="Previous chapter"
              >
                <ArrowLeft size={11} />
              </button>
              <span className="min-w-[46px] text-center text-[9.5px] font-medium tabular-nums tracking-[0.06em] text-[var(--muted)]">
                {chapter}/{book.chapters.length}
              </span>
              <button
                type="button"
                className="icon-btn !h-6 !w-6"
                onClick={onNext}
                disabled={!nextLabel}
                aria-label="Next chapter"
              >
                <ArrowRight size={11} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between gap-3">
            <button
              type="button"
              onClick={onOpenGoTo}
              className="group flex min-w-0 items-baseline gap-x-2 text-left"
              title="Go to a book, chapter, or verse [g]"
            >
              <span className="chapter-title truncate">{book.name}</span>
              <span className="chapter-title text-[var(--accent)]">{chapter}</span>
              <span className="hidden text-[8.5px] uppercase tracking-[0.12em] text-[var(--faint)] group-hover:text-[var(--accent)] sm:inline">
                [go]
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={onCopyChapter} className="btn">
                <span className="hidden sm:inline">Copy chapter</span>
                <span className="sm:hidden">Copy</span>
              </button>
              <button type="button" onClick={onOpenGoTo} className="btn sm:hidden">
                Go to
              </button>
            </div>
          </div>

          <div className="meta-row mt-2 gap-x-2">
            <span>{verses.length} verses</span>
            <span className="text-[var(--line-bright)]">/</span>
            <span>~{readingMinutes(verses)} min</span>
            <span className="text-[var(--line-bright)]">/</span>
            <span className="hidden sm:inline">
              {settings.verseNumbers ? "verses numbered" : "numbers hidden"}
            </span>
            <span className="ml-auto hidden text-[var(--faint)] sm:inline">
              {book.abbrev} {chapter}
            </span>
          </div>
        </div>
        <div className="h-[2px] w-full bg-[var(--line)]" aria-hidden="true">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div
        ref={scrollRef}
        id="reading-scroll"
        className="scroll-term min-h-0 flex-1 overflow-y-auto overscroll-contain"
        onScroll={(event) => {
          const element = event.currentTarget;
          const max = element.scrollHeight - element.clientHeight;
          setProgress(max > 0 ? Math.min(100, Math.max(0, (element.scrollTop / max) * 100)) : 0);
        }}
      >
        <article
          className="mx-auto w-full px-4 pb-9 pt-5 sm:px-8 sm:pt-7"
          style={{
            ...columnStyle,
            maxWidth: `min(100%, calc(${settings.measure}ch + 4rem))`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          <div className="mb-4 flex items-center justify-between border-b border-dashed border-[var(--line)] pb-1.5">
            <span className="label !text-[8.5px]">Chapter {chapter}</span>
            <span className="label !text-[8.5px]">
              {book.testament === "OT" ? "Old Testament" : "New Testament"}
            </span>
          </div>

          <div
            className="reading-body"
            data-layout={settings.verseLayout}
            data-justify={settings.justify ? "true" : "false"}
          >
            {settings.verseLayout === "flow" ? (
              <p>
                {verses.map((text, index) => {
                  const number = index + 1;
                  return (
                    <span
                      key={number}
                      id={`v-${number}`}
                      role="button"
                      tabIndex={0}
                      data-selected={selectedVerse === number ? "true" : "false"}
                      className="verse scroll-mt-4"
                      aria-label={`${formatReference(bookIndex, chapter, number)}. Select verse.`}
                      aria-pressed={selectedVerse === number}
                      onClick={() => toggleVerse(number)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleVerse(number);
                        }
                      }}
                    >
                      {settings.verseNumbers && <span className="verse-num">{number}</span>}
                      {text}
                      {" "}
                    </span>
                  );
                })}
              </p>
            ) : (
              verses.map((text, index) => {
                const number = index + 1;
                return (
                  <div
                    key={number}
                    id={`v-${number}`}
                    role="button"
                    tabIndex={0}
                    data-selected={selectedVerse === number ? "true" : "false"}
                    className="stacked-row scroll-mt-4"
                    aria-label={`${formatReference(bookIndex, chapter, number)}. Select verse.`}
                    aria-pressed={selectedVerse === number}
                    style={
                      settings.verseNumbers
                        ? undefined
                        : { gridTemplateColumns: "minmax(0, 1fr)" }
                    }
                    onClick={() => toggleVerse(number)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleVerse(number);
                      }
                    }}
                  >
                    {settings.verseNumbers && <span className="gutter">{number}</span>}
                    <span className="text">{text}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-2.5">
            <span className="label !text-[8.5px]">{formatReference(bookIndex, chapter)}</span>
            <span className="label !text-[8.5px]">KJV / public domain</span>
          </div>
        </article>

        <div
          className="mx-auto w-full px-4 pb-8 sm:px-8"
          style={{ maxWidth: `min(100%, calc(${settings.measure}ch + 4rem))` }}
        >
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className="nav-square"
              onClick={onPrev}
              disabled={!prevLabel}
              aria-label={`Previous chapter${prevLabel ? `: ${prevLabel}` : ""}`}
            >
              <span className="label !text-[8px]">← Previous</span>
              <span className="flex w-full items-center gap-1 text-[var(--text-dim)]">
                <span className="truncate text-[10.5px]">{prevLabel ?? "Beginning"}</span>
              </span>
            </button>
            <button
              type="button"
              className="nav-square next"
              onClick={onNext}
              disabled={!nextLabel}
              aria-label={`Next chapter${nextLabel ? `: ${nextLabel}` : ""}`}
            >
              <span className="label !text-[8px]">Next →</span>
              <span className="flex w-full items-center justify-end gap-1 text-[var(--text-dim)]">
                <span className="truncate text-[10.5px]">{nextLabel ?? "The end"}</span>
              </span>
            </button>
          </div>
          <p className="mt-3 text-center label !text-[8px]">
            end of {book.name} {chapter}
          </p>
        </div>
      </div>
    </div>
  );
}
