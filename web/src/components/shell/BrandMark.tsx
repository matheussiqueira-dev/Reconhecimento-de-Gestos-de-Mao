import { BRAND_MARK_BAR, BRAND_MARK_PATH } from "./brand-mark";

/** The favicon monogram at 28 px, coloured with tokens. */
export function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" width={28} height={28} aria-hidden="true" focusable="false">
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7"
        fill="var(--ms-surface)"
        stroke="var(--ms-border-strong)"
      />
      <path d={BRAND_MARK_PATH} fill="var(--ms-text)" />
      <rect {...BRAND_MARK_BAR} rx="1" fill="var(--ms-accent)" />
    </svg>
  );
}
