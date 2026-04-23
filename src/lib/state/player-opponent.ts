import { game } from "$lib/state/game.svelte";
import type { Opponent } from "$lib/state/opponent";

export class PlayerOpponent implements Opponent {
  private ws: WebSocket | null = null;

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket("ws://localhost:8080");
      this.ws = ws;

      ws.onopen = () => {
        game.status = "on";
        ws.send(JSON.stringify({ type: "find_match" }));
      };

      ws.onclose = () => {
        game.status = "off";
      };

      ws.onerror = (e) => reject(e);

      ws.onmessage = (packet) => {
        const msg = JSON.parse(packet.data);
        switch (msg.type) {
          case "finding":
            game.status = "find";
            break;
          case "match":
            game.status = "match";
            game.color = msg.color;
            game.turn = "white";
            resolve();
            break;
          case "move":
            game.lastMove = { from: msg.from, to: msg.to };
            break;
          case "turn":
            game.turn = msg.color;
            break;
          default:
            console.warn("unknown message", msg);
        }
      };
    });
  }

  sendMove(from: string, to: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("not connected");
      return;
    }
    this.ws.send(JSON.stringify({ type: "move", from, to }));
  }

  stop(): void {
    this.ws?.close();
    this.ws = null;
  }
}
