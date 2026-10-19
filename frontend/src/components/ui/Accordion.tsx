import type { ReactNode } from "react";

export interface AccordionItem {
  title: string;
  content: ReactNode;
}

/**
 * Native <details>/<summary> — keyboard accessible with no JS.
 * The chevron rotation is handled by the `.accordion` rules in globals.css.
 */
export function Accordion({
  items,
  className = "",
}: {
  items: AccordionItem[];
  className?: string;
}) {
  return (
    <div className={`divide-y divide-border border-y border-border ${className}`}>
      {items.map((item) => (
        <details key={item.title} className="accordion group py-1">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-[15px] font-semibold text-text [&::-webkit-details-marker]:hidden">
            {item.title}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden
              className="accordion-chevron shrink-0 text-text-muted transition-transform duration-200"
            >
              <path
                d="M4.5 7l4.5 4.5L13.5 7"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className="max-w-[65ch] pb-5 text-[15px] leading-7 text-text-muted">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}
