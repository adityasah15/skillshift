"use client";

import { useEffect, useId, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/** Keyboard trap: Tab cycles inside the panel, Escape closes, focus restores. */
function useDialogBehavior(open: boolean, panelRef: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panel && !panel.contains(document.activeElement)) {
      panel.focus();
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previouslyFocused?.focus?.();
    };
  }, [open, panelRef]);
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const descId = useId();
  useDialogBehavior(open, panelRef, onClose);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-text/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-border bg-surface p-6 shadow-lg outline-none"
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{title}</h2>
            {description && (
              <p id={descId} className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-muted transition hover:bg-surface-soft hover:text-text"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, description, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const descId = useId();
  useDialogBehavior(open, panelRef, onClose);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-text/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface p-6 shadow-lg outline-none"
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{title}</h2>
            {description && (
              <p id={descId} className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-muted transition hover:bg-surface-soft hover:text-text"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
