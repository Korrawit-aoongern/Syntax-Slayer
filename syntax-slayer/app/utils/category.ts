import type { Category } from "../types/game";

const CATEGORY_BORDER: Record<Category, string> = {
  SE: "border-emerald-400/70",
  CPE: "border-yellow-400/70",
  CS: "border-orange-400/70",
  IT: "border-sky-400/70",
  IS: "border-rose-400/70",
};

const CATEGORY_RING: Record<Category, string> = {
  SE: "ring-emerald-400/70",
  CPE: "ring-yellow-400/70",
  CS: "ring-orange-400/70",
  IT: "ring-sky-400/70",
  IS: "ring-rose-400/70",
};

export const getCategoryBorderClass = (category?: Category | null) =>
  category ? CATEGORY_BORDER[category] : "border-[var(--sw-border-soft)]";

export const getCategoryRingClass = (category?: Category | null) =>
  category ? CATEGORY_RING[category] : "ring-emerald-400/70";
