export type BgmId = "main_menu" | "battle_1" | "battle_2" | "battle_3";
export type SfxId =
  | "flip"
  | "match"
  | "mismatch"
  | "attack"
  | "crit"
  | "damage"
  | "block"
  | "heal"
  | "reveal"
  | "freeze"
  | "holyxaliber"
  | "levelup"
  | "click"
  | "combo"
  | "win"
  | "boss_victory"
  | "lose";

export const BGM_TRACKS: Record<BgmId, { src: string; loop: boolean }> = {
  main_menu: { src: "/audio/Neon Loading Screen.mp3", loop: true },
  battle_1: { src: "/audio/Midnight Gridlock.mp3", loop: true },
  battle_2: { src: "/audio/Midnight Gridlock (Alt).mp3", loop: true },
  battle_3: { src: "/audio/Midnight Overclock.mp3", loop: true },
};

export const SFX_TRACKS: Record<SfxId, { src: string }> = {
  flip: { src: "/audio/sfx/sfx_card-flip.mp3" },
  match: { src: "/audio/sfx/sfx_correct.mp3" },
  mismatch: { src: "/audio/sfx/sfx_wrong.mp3" },
  attack: { src: "/audio/sfx/sfx_sword-slash.mp3" },
  crit: { src: "/audio/sfx/sfx_sword-crit.mp3" },
  damage: { src: "/audio/sfx/sfx_hit.mp3" },
  block: { src: "/audio/sfx/sfx_block.mp3" },
  heal: { src: "/audio/sfx/sfx_heal.mp3" },
  reveal: { src: "/audio/sfx/sfx_reveal.mp3" },
  freeze: { src: "/audio/sfx/sfx_freeze.mp3" },
  holyxaliber: { src: "/audio/sfx/sfx_holyxaliber.mp3" },
  levelup: { src: "/audio/sfx/sfx_levelup.wav" },
  click: { src: "/audio/sfx/sfx_click.mp3" },
  combo: { src: "/audio/sfx/sfx_combo.mp3" },
  win: { src: "/audio/sfx/sfx_levelup.wav" },
  boss_victory: { src: "/audio/sfx/sfx_boss-victory.wav" },
  lose: { src: "/audio/sfx/sfx_defeated.mp3" },
};
