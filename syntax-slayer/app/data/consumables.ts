import type { ConsumableId } from "../types/game";

export const CONSUMABLE_POOL: ConsumableId[] = [
  "minor_reveal",
  "major_reveal",
  "cosmic_reveal",
  "freeze",
  "obsidian_shield",
  "holyxaliber",
  "bandage",
  "med_kit",
  "holy_heal",
];

export const CONSUMABLE_LABELS: Record<ConsumableId, string> = {
  minor_reveal: "Minor Reveal",
  major_reveal: "Major Reveal",
  cosmic_reveal: "Cosmic Reveal",
  freeze: "Freeze",
  obsidian_shield: "Obsidian Shield",
  holyxaliber: "Holyxaliber",
  bandage: "Bandage",
  med_kit: "Med Kit",
  holy_heal: "Holy Heal",
};

export const ENDLESS_CONSUMABLE_POOL: ConsumableId[] = [
  "minor_reveal",
  "major_reveal",
  "cosmic_reveal",
  "freeze",
];
