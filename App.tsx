import { useEffect, useRef, useState } from "react";
import {
  BOOKS,
  DEFAULT_READING,
  adjacentChapter,
  clampReading,
  findBookIndex,
  formatReference,
} from "./data/bible";
import {
  DEFAULT_SETTINGS,
  UI_FONT_STACK,
  fontLabel,
  resolveFontStack,
} from "./data/preferences";
import { usePersistentState } from "./hooks/usePersistentState";
import type { CustomFont, ReadingState, Settings } from "./types";
import { IndexPanel } from "./components/IndexPanel";
import { ReaderPane } from "./components/ReaderPane";
import { SearchOverlay } from "./components/SearchOverlay";
import { GoToOverlay } from "./components/GoToOverlay";
import { SettingsPanel } from "./components/SettingsPanel";
import { cn } from "./utils/cn";

type OverlayName = "search" | "goto" | "settings" | "index" | null;

function deepLinkedReading(): ReadingState | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("book");
    if (!requested) return null;
    const bookIndex = findBookIndex(requested);
    if (bookIndex < 0) return null;
    const chapter = Number.parseInt(params.get("chapter") ?? "1", 10);
    return clampReading(bookIndex, Number.isFinite(chapter) ? chapter : 1);
  } catch {
    return null;
  }
}

function deepLinkedVerse(): number | null {
  try {
    const value = Number.parseInt(new URLSearchParams(window.location.search).get("verse") ?? "", 10);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [storedSettings, setStoredSettings] = usePersistentState<Settings>(
    "basickjvbible:settings:v1",
    DEFAULT_SETTINGS
  );
  const settings: Settings = { ...DEFAULT_SETTINGS, ...storedSettings };
  const [customFont, setCustomFont] = usePersistentState<CustomFont | null>(
    "basickjvbible:font:v1",
    null
  );
  const [lastReading, setLastReading] = usePersistentState<ReadingState>(
    "basickjvbible:last-reading:v1",
    DEFAULT_READING
  );

  const [reading, setReading] = useState<ReadingState>(
    () => deepLinkedReading() ?? clampReading(lastReading.bookIndex, lastReading.chapter)
  );
  const [selectedVerse, setSelectedVerse] = useState<number | null>(deepLinkedVerse);
  const [overlay, setOverlay] = useState<OverlayName>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fontStatus, setFontStatus] = useState<string | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{ verse: number; nonce: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  const readingFont = resolveFontStack(settings.fontId, customFont);
  const currentBook = BOOKS[reading.bookIndex];
  const currentVerses = currentBook.chapters[reading.chapter - 1];
  const safeSelectedVerse =
    selectedVerse && selectedVerse >= 1 && selectedVerse <= currentVerses.length
      ? selectedVerse
      : null;
  const selectedText = safeSelectedVerse ? currentVerses[safeSelectedVerse - 1] : null;

  const previous = adjacentChapter(reading.bookIndex, reading.chapter, -1);
  const next = adjacentChapter(reading.bookIndex, reading.chapter, 1);
  const prevLabel = previous ? formatReference(previous.bookIndex, previous.chapter).toUpperCase() : null;
  const nextLabel = next ? formatReference(next.bookIndex, next.chapter).toUpperCase() : null;

  const notify = (message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2200);
  };

  useEffect(() => {
    return () => window.clearTimeout(noticeTimer.current);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = settings.palette;
    root.dataset.cursor = settings.cursor ? "on" : "off";
    root.style.setProperty("--reading-font", readingFont);
    root.style.setProperty("--ui-font", settings.applyFontToUi ? readingFont : UI_FONT_STACK);
  }, [settings.palette, settings.cursor, settings.applyFontToUi, readingFont]);

  useEffect(() => {
    setLastReading(reading);
  }, [reading, setLastReading]);

  useEffect(() => {
    const book = BOOKS[reading.bookIndex];
    const url = new URL(window.location.href);
    url.searchParams.set("book", book.id);
    url.searchParams.set("chapter", String(reading.chapter));
    if (safeSelectedVerse) url.searchParams.set("verse", String(safeSelectedVerse));
    else url.searchParams.delete("verse");
    window.history.replaceState({}, "", url);
    document.title = `${formatReference(reading.bookIndex, reading.chapter, safeSelectedVerse)} · basickjvbible`;
  }, [reading, safeSelectedVerse]);

  useEffect(() => {
    if (!customFont || !customFont.dataUrl) return;
    let cancelled = false;
    let registered: FontFace | null = null;
    const face = new FontFace(customFont.family, `url("${customFont.dataUrl}")`);
    face
      .load()
      .then((loaded) => {
        if (cancelled) return;
        registered = loaded;
        document.fonts.add(loaded);
      })
      .catch(() => {
        if (!cancelled) setFontStatus("saved font could not be loaded");
      });
    return () => {
      cancelled = true;
      if (registered) document.fonts.delete(registered);
    };
  }, [customFont]);

  useEffect(() => {
    if (!scrollTarget) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`v-${scrollTarget.verse}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [scrollTarget]);

  useEffect(() => {
    const verse = deepLinkedVerse();
    if (!verse) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`v-${verse}`)?.scrollIntoView({ block: "center" });
    }, 420);
    return () => window.clearTimeout(timer);
  }, []);

  const updateSettings = (patch: Partial<Settings>) => {
    setStoredSettings((previousSettings) => ({
      ...DEFAULT_SETTINGS,
      ...previousSettings,
      ...patch,
    }));
  };

  const goTo = (bookIndex: number, chapter: number, verse: number | null = null) => {
    const destination = clampReading(bookIndex, chapter);
    const verses = BOOKS[destination.bookIndex].chapters[destination.chapter - 1];
    const validVerse = verse && verse >= 1 && verse <= verses.length ? verse : null;
    setReading(destination);
    setSelectedVerse(validVerse);
    if (validVerse) setScrollTarget({ verse: validVerse, nonce: Date.now() });
    setOverlay(null);
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(message);
    } catch {
      notify("clipboard unavailable");
    }
  };

  const copyVerse = () => {
    if (!selectedText || !safeSelectedVerse) return;
    void copy(
      `“${selectedText}”\n— ${formatReference(reading.bookIndex, reading.chapter, safeSelectedVerse)} (KJV)`,
      "verse copied"
    );
  };

  const copyChapter = () => {
    const text = `${currentBook.name} ${reading.chapter} · KJV\n\n${currentVerses
      .map((verse, index) => `${index + 1} ${verse}`)
      .join("\n")}`;
    void copy(text, "chapter copied");
  };

  const copyLink = () => {
    void copy(window.location.href, "link copied");
  };

  const handleFontUpload = (file: File) => {
    setFontStatus(null);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["ttf", "otf", "woff", "woff2"].includes(extension)) {
      setFontStatus("unsupported file · use ttf, otf, woff, or woff2");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setFontStatus("file too large · max 2.5 mb");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setFontStatus("could not read that file");
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const family = `KJVCustom${Date.now()}`;
      const face = new FontFace(family, `url("${dataUrl}")`);
      face
        .load()
        .then(() => {
          setCustomFont({ family, fileName: file.name, dataUrl, size: file.size });
          updateSettings({ fontId: "custom" });
          setFontStatus(`loaded ${file.name}`);
        })
        .catch(() => setFontStatus("that font file could not be parsed"));
    };
    reader.readAsDataURL(file);
  };

  const removeFont = () => {
    setCustomFont(null);
    updateSettings({ fontId: "jetbrains" });
    setFontStatus("custom font removed");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (overlay) {
          event.preventDefault();
          setOverlay(null);
          return;
        }
        if (selectedVerse) {
          event.preventDefault();
          setSelectedVerse(null);
        }
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOverlay("search");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (overlay) return;

      switch (event.key) {
        case "/":
          event.preventDefault();
          setOverlay("search");
          break;
        case "g":
        case "G":
          event.preventDefault();
          setOverlay("goto");
          break;
        case "s":
        case "S":
          event.preventDefault();
          setOverlay("settings");
          break;
        case "i":
        case "I":
          event.preventDefault();
          setOverlay("index");
          break;
        case "[":
          if (previous) {
            event.preventDefault();
            goTo(previous.bookIndex, previous.chapter);
          }
          break;
        case "]":
          if (next) {
            event.preventDefault();
            goTo(next.bookIndex, next.chapter);
          }
          break;
        case "j":
        case "J":
          scrollRef.current?.scrollBy({ top: 120 });
          break;
        case "k":
        case "K":
          scrollRef.current?.scrollBy({ top: -120 });
          break;
        case "c":
        case "C":
          if (safeSelectedVerse) void copyVerse();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay, selectedVerse, safeSelectedVerse, reading.bookIndex, reading.chapter, previous, next]);

  const mobileActions: {
    label: string;
    glyph: string;
    action: () => void;
    disabled?: boolean;
    strong?: boolean;
  }[] = [
    { label: "index", glyph: "▤", action: () => setOverlay("index") },
    { label: "search", glyph: "/", action: () => setOverlay("search"), strong: true },
    {
      label: "prev",
      glyph: "←",
      action: () => previous && goTo(previous.bookIndex, previous.chapter),
      disabled: !previous,
    },
    {
      label: "next",
      glyph: "→",
      action: () => next && goTo(next.bookIndex, next.chapter),
      disabled: !next,
    },
    { label: "config", glyph: "Aa", action: () => setOverlay("settings") },
  ];

  return (
    <div className="app-frame flex h-[100dvh] flex-col overflow-hidden">
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--line-bright)] bg-[var(--panel)] px-2 sm:px-3">
        <button
          type="button"
          onClick={() => setOverlay("index")}
          className="icon-btn lg:hidden"
          aria-label="Open book index"
        >
          ▤
        </button>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="term-cursor text-[13px] leading-none">▌</span>
          <span className="brand">
            basic<em>kjv</em>bible
          </span>
          <span className="tag">KJV</span>
        </div>
        <span className="ml-3 hidden truncate text-[9px] uppercase tracking-[0.14em] text-[var(--faint)] xl:inline">
          66 books / 1,189 chapters / 31,102 verses
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="btn hidden sm:inline-flex"
            onClick={() => setOverlay("search")}
            aria-label="Search the whole Bible"
          >
            <span className="text-[var(--accent)]">/</span> search
            <span className="key hidden md:inline-flex">⌘k</span>
          </button>
          <button
            type="button"
            onClick={() => setOverlay("search")}
            className="icon-btn sm:hidden"
            aria-label="Search the whole Bible"
          >
            /
          </button>
          <button
            type="button"
            onClick={() => setOverlay("goto")}
            className="btn hidden sm:inline-flex"
            aria-label="Go to a Bible reference"
          >
            go to <span className="key hidden md:inline-flex">g</span>
          </button>
          <button
            type="button"
            onClick={() => setOverlay("settings")}
            className="btn"
            aria-label="Open reading configuration"
          >
            <span className="text-[11px] leading-none">Aa</span>
            <span className="hidden md:inline">config</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[244px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)] lg:flex">
          <IndexPanel
            bookIndex={reading.bookIndex}
            chapter={reading.chapter}
            onSelect={(bookIndex, chapter) => goTo(bookIndex, chapter)}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--bg)]">
          <ReaderPane
            bookIndex={reading.bookIndex}
            chapter={reading.chapter}
            selectedVerse={safeSelectedVerse}
            settings={settings}
            readingFont={readingFont}
            scrollRef={scrollRef}
            onSelectVerse={setSelectedVerse}
            onPrev={() => previous && goTo(previous.bookIndex, previous.chapter)}
            onNext={() => next && goTo(next.bookIndex, next.chapter)}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
            onCopyChapter={copyChapter}
            onOpenGoTo={() => setOverlay("goto")}
          />

          {safeSelectedVerse && selectedText && (
            <div className="shrink-0 border-t border-[var(--line-bright)] bg-[var(--panel-2)] px-2.5 py-1.5 sm:px-3">
              <div className="flex items-center gap-2">
                <span className="hidden shrink-0 text-[9.5px] uppercase tracking-[0.1em] text-[var(--accent)] sm:inline">
                  {formatReference(reading.bookIndex, reading.chapter, safeSelectedVerse)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-[var(--text-dim)]">
                  <span className="mr-1.5 text-[var(--accent)] sm:hidden">
                    {formatReference(reading.bookIndex, reading.chapter, safeSelectedVerse)}
                  </span>
                  {selectedText}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" className="btn btn-sm" onClick={copyVerse}>
                    copy
                  </button>
                  <button type="button" className="btn btn-sm hidden sm:inline-flex" onClick={copyLink}>
                    link
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-quiet"
                    onClick={() => setSelectedVerse(null)}
                    aria-label="Clear verse selection"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav
        className="grid shrink-0 grid-cols-5 border-t border-[var(--line-bright)] bg-[var(--panel)] lg:hidden"
        aria-label="Reader controls"
      >
        {mobileActions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            disabled={item.disabled}
            className={cn(
              "flex h-10 flex-col items-center justify-center gap-0.5 border-r border-[var(--line)] text-[var(--muted)] transition-colors last:border-r-0 hover:bg-[var(--panel-2)] hover:text-[var(--accent)]",
              item.disabled && "opacity-30"
            )}
            aria-label={item.label}
          >
            <span
              className={cn(
                "text-[13px] leading-none",
                item.strong && "text-[var(--accent)]"
              )}
            >
              {item.glyph}
            </span>
            <span className="text-[8.5px] uppercase tracking-[0.12em]">{item.label}</span>
          </button>
        ))}
      </nav>

      <footer className="flex min-h-6 shrink-0 items-center gap-2 overflow-hidden border-t border-[var(--line-bright)] bg-[var(--panel)] px-2 pb-[env(safe-area-inset-bottom)] pt-1 text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] sm:px-3">
        <span className="flex shrink-0 items-center gap-1.5 text-[var(--accent)]">
          <span className="status-led" /> ready
        </span>
        <span className="hidden text-[var(--line-bright)] sm:inline">|</span>
        <span className="truncate text-[var(--text-dim)]">
          {formatReference(reading.bookIndex, reading.chapter, safeSelectedVerse)}
        </span>
        <span className="hidden shrink-0 sm:inline">/ kjv</span>
        <span className="hidden shrink-0 md:inline">/ {currentVerses.length} verses</span>
        {settings.hints && (
          <span className="ml-auto hidden shrink-0 items-center gap-2.5 xl:flex">
            <span className="flex items-center gap-1">
              <span className="key">j</span>
              <span className="key">k</span> scroll
            </span>
            <span className="flex items-center gap-1">
              <span className="key">[</span>
              <span className="key">]</span> chapter
            </span>
            <span className="flex items-center gap-1">
              <span className="key">/</span> search
            </span>
            <span className="flex items-center gap-1">
              <span className="key">s</span> config
            </span>
          </span>
        )}
        <span
          className={cn(
            "status-font",
            settings.hints ? "ml-auto xl:ml-3" : "ml-auto"
          )}
          title={`${fontLabel(settings.fontId, customFont)} · ${settings.fontSize}px`}
        >
          {fontLabel(settings.fontId, customFont)} · {settings.fontSize}px
        </span>
      </footer>

      {settings.scanlines && <div className="crt-overlay" aria-hidden="true" />}

      {overlay === "index" && (
        <div className="fixed inset-0 z-[82] lg:hidden">
          <button
            type="button"
            onClick={() => setOverlay(null)}
            aria-label="Close book index"
            className="absolute inset-0 cursor-default bg-[rgba(4,4,3,0.72)]"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] animate-drawer-in border-r border-[var(--line-bright)] bg-[var(--panel)]">
            <IndexPanel
              bookIndex={reading.bookIndex}
              chapter={reading.chapter}
              onSelect={(bookIndex, chapter) => goTo(bookIndex, chapter)}
              onClose={() => setOverlay(null)}
            />
          </div>
        </div>
      )}

      <SearchOverlay
        open={overlay === "search"}
        onClose={() => setOverlay(null)}
        onNavigate={goTo}
      />
      <GoToOverlay open={overlay === "goto"} onClose={() => setOverlay(null)} onNavigate={goTo} />
      <SettingsPanel
        open={overlay === "settings"}
        onClose={() => setOverlay(null)}
        settings={settings}
        onChange={updateSettings}
        customFont={customFont}
        onUploadFont={handleFontUpload}
        onRemoveFont={removeFont}
        fontStatus={fontStatus}
      />

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[76px] right-2 z-[75] animate-term-in border border-[var(--accent)] bg-[var(--panel)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.1em] text-[var(--accent)] shadow-[0_10px_30px_rgba(0,0,0,0.45)] sm:right-3 lg:bottom-9"
        >
          › {notice}
        </div>
      )}
    </div>
  );
}
