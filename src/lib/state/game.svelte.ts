import type { Color } from "$lib/state/opponent";

export type Status = "off" | "on" | "find" | "match" | "ended";

export type GameResult = {
  winner: "white" | "black" | "draw" | "opponent_left";
  reason: string;
};

export type ChatMessage = {
  from: "me" | "opponent";
  text: string;
  at: number;
};

export const game = $state({
  status: "off" as Status,
  color: null as Color | null,
  turn: null as Color | null,
  lastMove: null as { from: string; to: string; promotion?: string } | null,
  moveCount: 0,
  lastMoveColor: null as Color | null,
  result: null as GameResult | null,
  opponentName: null as string | null,
  moves: [] as string[],
  messages: [] as ChatMessage[],
  drawOfferFrom: null as "me" | "opponent" | null,
});

export function resetGame() {
  game.status = "off";
  game.color = null;
  game.turn = null;
  game.lastMove = null;
  game.moveCount = 0;
  game.lastMoveColor = null;
  game.result = null;
  game.opponentName = null;
  game.moves = [];
  game.messages = [];
  game.drawOfferFrom = null;
}
