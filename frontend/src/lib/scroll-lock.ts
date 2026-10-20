/**
 * Body scroll lock shared by overlays (modal, drawer, mobile menu).
 *
 * Hiding body overflow removes the document scrollbar, which shifts the
 * whole page right on platforms with classic scrollbars. The lock pads the
 * body by the missing scrollbar width so the layout stays still; a counter
 * keeps nested locks from fighting over the same state.
 */

let locks = 0;
let previousOverflow = "";
let previousPaddingRight = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  locks += 1;
  if (locks > 1) return;

  const body = document.body;
  const root = document.documentElement;
  previousOverflow = body.style.overflow;
  previousPaddingRight = body.style.paddingRight;

  // `scrollbar-gutter: stable` already reserves the scrollbar's space. Adding
  // body padding on top of it double-compensates and shifts the page sideways.
  const gutterStyle = getComputedStyle(root).scrollbarGutter;
  const hasStableGutter = typeof gutterStyle === "string" && gutterStyle.includes("stable");
  const gap = window.innerWidth - root.clientWidth;
  if (!hasStableGutter && gap > 0) {
    const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + gap}px`;
  }
  body.style.overflow = "hidden";
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;

  const body = document.body;
  body.style.overflow = previousOverflow;
  body.style.paddingRight = previousPaddingRight;
}
