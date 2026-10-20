"use client";

import { useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
}

/**
 * Controlled tab list. Panels stay in the parent:
 *   tab id   = `${panelIdPrefix}-tab-${id}`
 *   panel id = `${panelIdPrefix}-panel-${id}`
 */
export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  panelIdPrefix = "tabs",
  className = "",
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  panelIdPrefix?: string;
  className?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    const item = items[next];
    onChange(item.id);
    refs.current[item.id]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-1 overflow-x-auto border-b border-border ${className}`}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[item.id] = node;
            }}
            id={`${panelIdPrefix}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${panelIdPrefix}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`relative min-h-[44px] shrink-0 cursor-pointer px-4 text-sm font-semibold transition ${
              selected
                ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                : "text-text-muted hover:text-text"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  value,
  panelIdPrefix = "tabs",
  children,
}: {
  id: string;
  value: string;
  panelIdPrefix?: string;
  children: React.ReactNode;
}) {
  if (id !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${panelIdPrefix}-panel-${id}`}
      aria-labelledby={`${panelIdPrefix}-tab-${id}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
