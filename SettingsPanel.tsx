import { createPortal } from "react-dom";
import { DEFAULT_SETTINGS, FONTS, PALETTES } from "../data/preferences";
import type { CustomFont, Settings } from "../types";
import { cn } from "../utils/cn";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  customFont: CustomFont | null;
  onUploadFont: (file: File) => void;
  onRemoveFont: () => void;
  fontStatus: string | null;
};

export function SettingsPanel({
  open,
  onClose,
  settings,
  onChange,
  customFont,
  onUploadFont,
  onRemoveFont,
  fontStatus,
}: SettingsPanelProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85]">
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(4,4,3,0.68)] backdrop-blur-[1px]"
      />
      <aside
        className="drawer absolute inset-y-0 right-0 flex w-full animate-drawer-in flex-col sm:max-w-[404px]"
        role="dialog"
        aria-modal="true"
        aria-label="Reading configuration"
      >
        <header className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--line)] bg-[var(--panel-2)] px-2.5">
          <span className="text-[var(--accent)]">┌</span>
          <h2 className="label !text-[var(--text-dim)]">Config</h2>
          <span className="tag ml-1">local</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="ml-auto flex h-5 items-center gap-1.5 px-1 text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            <span className="key">esc</span>
            <span>✕</span>
          </button>
        </header>

        <div className="drawer-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 p-3.5">
            <Section label="Font · scripture text">
              <div className="space-y-1">
                {FONTS.map((font) => {
                  const active = settings.fontId === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      className="font-row"
                      data-active={active}
                      aria-pressed={active}
                      onClick={() => onChange({ fontId: font.id })}
                    >
                      <span className="aa" style={{ fontFamily: font.stack }}>
                        Aa
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[12px] text-[var(--text)]"
                          style={{ fontFamily: font.stack }}
                        >
                          {font.label}
                        </span>
                        <span className="label !text-[8.5px]">{font.kind} · built in</span>
                      </span>
                      <span className={cn("text-[9px]", active ? "text-[var(--accent)]" : "text-[var(--faint)]")}>
                        {active ? "●" : "○"}
                      </span>
                    </button>
                  );
                })}

                {customFont && (
                  <>
                    <button
                      type="button"
                      className="font-row"
                      data-active={settings.fontId === "custom"}
                      aria-pressed={settings.fontId === "custom"}
                      onClick={() => onChange({ fontId: "custom" })}
                    >
                      <span
                        className="aa"
                        style={{ fontFamily: `"${customFont.family}", monospace` }}
                      >
                        Aa
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[12px] text-[var(--text)]"
                          style={{ fontFamily: `"${customFont.family}", monospace` }}
                        >
                          {customFont.fileName}
                        </span>
                        <span className="label !text-[8.5px]">
                          uploaded · {(customFont.size / 1024).toFixed(0)} kb
                        </span>
                      </span>
                      <span
                        className={cn(
                          "text-[9px]",
                          settings.fontId === "custom" ? "text-[var(--accent)]" : "text-[var(--faint)]"
                        )}
                      >
                        {settings.fontId === "custom" ? "●" : "○"}
                      </span>
                    </button>
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[8.5px] uppercase tracking-[0.08em] text-[var(--faint)]">
                        stored on this device
                      </span>
                      <button
                        type="button"
                        onClick={onRemoveFont}
                        className="text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted)] underline decoration-[var(--line-bright)] underline-offset-2 transition-colors hover:text-[var(--danger)]"
                      >
                        remove
                      </button>
                    </div>
                  </>
                )}
              </div>

              <label className="mt-2 flex cursor-pointer items-center justify-between gap-2 border border-dashed border-[var(--line-bright)] bg-[var(--bg-deep)] px-2.5 py-2 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                <span className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                  <span className="text-[var(--accent)]">↑</span> upload font file
                </span>
                <span className="label !text-[8.5px]">ttf · otf · woff</span>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUploadFont(file);
                    event.target.value = "";
                  }}
                />
              </label>
              <p className="mt-1 text-[8.5px] leading-relaxed text-[var(--faint)]">
                Max 2.5 MB. Files never leave your browser.
              </p>
              {fontStatus && (
                <p className="mt-1.5 flex items-center gap-1.5 border-l border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 text-[9px] uppercase tracking-[0.06em] text-[var(--accent)]">
                  › {fontStatus}
                </p>
              )}
              <CheckRow
                label="apply reading font to interface"
                checked={settings.applyFontToUi}
                onChange={(checked) => onChange({ applyFontToUi: checked })}
                hint="full theme"
              />
            </Section>

            <Section label="Type">
              <SliderRow
                label="font size"
                display={`${settings.fontSize}px`}
                value={settings.fontSize}
                min={12}
                max={28}
                step={1}
                onChange={(value) => onChange({ fontSize: value })}
              />
              <SliderRow
                label="line height"
                display={settings.lineHeight.toFixed(2)}
                value={settings.lineHeight}
                min={1.4}
                max={2.6}
                step={0.05}
                onChange={(value) => onChange({ lineHeight: value })}
              />
              <SliderRow
                label="column width"
                display={`${settings.measure}ch`}
                value={settings.measure}
                min={44}
                max={110}
                step={2}
                onChange={(value) => onChange({ measure: value })}
              />
              <div className="mt-3 border-t border-[var(--line)] pt-2">
                <CheckRow
                  label="verse numbers"
                  checked={settings.verseNumbers}
                  onChange={(checked) => onChange({ verseNumbers: checked })}
                />
                <CheckRow
                  label="justify scripture"
                  checked={settings.justify}
                  onChange={(checked) => onChange({ justify: checked })}
                />
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="text-[11.5px] text-[var(--text-dim)]">verse layout</span>
                  <div className="seg" role="group" aria-label="Verse layout">
                    <button
                      type="button"
                      data-active={settings.verseLayout === "flow"}
                      onClick={() => onChange({ verseLayout: "flow" })}
                    >
                      Flow
                    </button>
                    <button
                      type="button"
                      data-active={settings.verseLayout === "stacked"}
                      onClick={() => onChange({ verseLayout: "stacked" })}
                    >
                      Stacked
                    </button>
                  </div>
                </div>
              </div>
            </Section>

            <Section label="Terminal">
              <div className="grid grid-cols-3 gap-1.5">
                {PALETTES.map((palette) => {
                  const active = settings.palette === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      className="swatch"
                      data-active={active}
                      aria-pressed={active}
                      onClick={() => onChange({ palette: palette.id })}
                    >
                      <span
                        className="swatch-preview"
                        style={{
                          background: palette.background,
                          color: palette.accent,
                          border: `1px solid ${palette.accent}55`,
                        }}
                      >
                        <span>▌</span>
                        <span>●</span>
                      </span>
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate text-[9.5px] uppercase tracking-[0.06em] text-[var(--text-dim)]">
                          {palette.label}
                        </span>
                        <span
                          className="text-[8px]"
                          style={{ color: active ? "var(--accent)" : "var(--faint)" }}
                        >
                          {active ? "●" : palette.note}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 space-y-0.5 border-t border-[var(--line)] pt-2">
                <CheckRow
                  label="scanlines & vignette"
                  checked={settings.scanlines}
                  onChange={(checked) => onChange({ scanlines: checked })}
                />
                <CheckRow
                  label="blinking cursor"
                  checked={settings.cursor}
                  onChange={(checked) => onChange({ cursor: checked })}
                />
                <CheckRow
                  label="keyboard hints"
                  checked={settings.hints}
                  onChange={(checked) => onChange({ hints: checked })}
                />
              </div>
            </Section>

            <Section label="Keys">
              <div className="space-y-1">
                {[
                  ["/", "search the whole bible"],
                  ["g", "go to reference"],
                  ["s", "open config"],
                  ["i", "book index"],
                  ["[  ]", "previous / next chapter"],
                  ["j  k", "scroll the chapter"],
                  ["c", "copy selected verse"],
                  ["esc", "close / clear selection"],
                ].map(([key, action]) => (
                  <div key={action} className="flex items-center gap-2">
                    <span className="key min-w-[34px] justify-center">{key}</span>
                    <span className="text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
                      {action}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 border-t border-[var(--line)] pt-2 text-[8.5px] leading-relaxed text-[var(--faint)]">
                Every preference is stored in this browser. The King James text is public domain and
                bundled offline.
              </p>
            </Section>

            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
              <button
                type="button"
                className="text-[8.5px] uppercase tracking-[0.1em] text-[var(--muted)] underline decoration-[var(--line-bright)] underline-offset-2 transition-colors hover:text-[var(--accent)]"
                onClick={() => onChange(DEFAULT_SETTINGS)}
              >
                reset display
              </button>
              <span className="label !text-[8.5px]">autosaved</span>
            </div>
          </div>
        </div>

        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[var(--line)] bg-[var(--panel-2)] px-2.5">
          <span className="text-[8px] uppercase tracking-[0.1em] text-[var(--faint)]">
            basickjvbible · config
          </span>
          <button type="button" onClick={onClose} className="btn btn-sm">
            done
          </button>
        </footer>
      </aside>
    </div>,
    document.body
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="section-head">
        <span className="label !text-[var(--text-dim)]">{label}</span>
      </div>
      {children}
    </section>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className="term-check"
      onClick={() => onChange(!checked)}
    >
      <span className="box">{checked ? "x" : ""}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[8px] uppercase tracking-[0.06em] text-[var(--faint)]">{hint}</span>}
    </button>
  );
}

function SliderRow({
  label,
  display,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-2.5 first:mt-0">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-[var(--text-dim)]">{label}</span>
        <span className="text-[10.5px] tabular-nums text-[var(--accent)]">{display}</span>
      </div>
      <input
        type="range"
        className="range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </div>
  );
}
