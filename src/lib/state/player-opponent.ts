import { game } from "$lib/state/game.svelte";
import type { Opponent } from "$lib/state/opponent";
import { connect, send, subscribe } from "$lib/state/ws-conn";

export class PlayerOpponent implements Opponent {
  private unsubscribe: (() => void) | null = null;
  private resolveStart: (() => void) | null = null;

  start(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.resolveStart = resolve;
      this.unsubscribe = subscribe((msg) => this.handleMessage(msg));
      try {
        await connect();
      } catch (e) {
        this.cleanup();
        reject(e);
        return;
      }
      game.status = "on";
      send({ type: "find_match" });
    });
  }

  private handleMessage(msg: any): void {
    switch (msg.type) {
      case "finding":
        game.status = "find";
        break;
      case "match":
        game.status = "match";
        game.color = msg.color;
        game.turn = "white";
        game.opponentName = msg.opponent ?? null;
        this.resolveStart?.();
        this.resolveStart = null;
        break;
      case "move":
        game.lastMove = {
          from: msg.from,
          to: msg.to,
          promotion: msg.promotion,
        };
        break;
      case "turn":
        game.turn = msg.color;
        break;
      case "game_over":
        game.status = "ended";
        game.result = { winner: msg.result, reason: msg.reason };
        game.drawOfferFrom = null;
        break;
      case "opponent_left":
        game.status = "ended";
        game.result = { winner: "opponent_left", reason: "disconnect" };
        game.drawOfferFrom = null;
        break;
      case "draw_offered":
        game.drawOfferFrom = "opponent";
        break;
      case "draw_declined":
      case "draw_withdrawn":
        game.drawOfferFrom = null;
        break;
      case "chat":
        game.messages.push({
          from: "opponent",
          text: msg.text,
          at: Date.now(),
        });
        break;
      // friend/presence/invite messages are handled by friends store, not here
    }
  }

  sendMove(from: string, to: string, promotion?: string): void {
    send({ type: "move", from, to, promotion });
  }

  sendChat(text: string): void {
    send({ type: "chat", text });
  }

  resign(): void {
    send({ type: "resign" });
  }

  offerDraw(): void {
    send({ type: "draw_offer" });
    game.drawOfferFrom = "me";
  }

  acceptDraw(): void {
    send({ type: "draw_accept" });
  }

  declineDraw(): void {
    send({ type: "draw_decline" });
    game.drawOfferFrom = null;
  }

  private cleanup(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.resolveStart = null;
  }

  stop(): void {
    this.cleanup();
    // we don't close the shared WS; layout owns it
  }
}
