import type { Color } from "$lib/state/opponent";

export type Status = "off" | "on" | "find" | "match" | "ended";

export type GameResult = {
  winner: "white" | "black" | "draw" | "opponent_left";
  reason: string;
};

export const game = $state({
  status: "off" as Status,
  color: null as Color | null,
  turn: null as Color | null,
  lastMove: null as { from: string; to: string; promotion?: string } | null,
  moveCount: 0,
  lastMoveColor: null as Color | null,
  result: null as GameResult | null,
});

export function resetGame() {
  game.status = "off";
  game.color = null;
  game.turn = null;
  game.lastMove = null;
  game.moveCount = 0;
  game.lastMoveColor = null;
  game.result = null;
}
