import type { Color } from "$lib/state/opponent";

export type Status = "off" | "on" | "find" | "match";

export const game = $state({
  status: "off" as Status,
  color: null as Color | null,
  turn: null as Color | null,
  lastMove: null as { from: string; to: string; promotion?: string } | null,
  moveCount: 0,
  lastMoveColor: null as Color | null,
});

export function resetGame() {
  game.status = "off";
  game.color = null;
  game.turn = null;
  game.lastMove = null;
  game.moveCount = 0;
  game.lastMoveColor = null;
}
