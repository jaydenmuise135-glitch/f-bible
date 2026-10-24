import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

export function Overlay({
  open,
  onClose,
  title,
  meta,
  children,
  footer,
  width = "max-w-[720px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-2 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(4,4,3,0.72)] backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative mt-[6vh] flex max-h-[82vh] w-full animate-overlay-in flex-col border border-[var(--line-bright)] bg-[var(--panel)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]",
          width
        )}
      >
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--line)] bg-[var(--panel-2)] px-2.5">
          <span className="text-[var(--accent)]">┌</span>
          <h2 className="label !text-[var(--text-dim)]">{title}</h2>
          {meta && <span className="ml-1 hidden text-[14px] uppercase tracking-[0.1em] text-[var(--faint)] sm:inline">{meta}</span>}
          <span className="ml-auto flex items-center gap-2">
            <span className="key">esc</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-5 w-5 items-center justify-center text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
            >
              ✕
            </button>
          </span>
        </div>
        <div className="scroll-term min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-[var(--line)] bg-[var(--panel-2)] px-3 py-2">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle.toLowerCase() ? (
          <mark key={index} className="hit">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}
