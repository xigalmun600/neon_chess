import { game } from "$lib/state/game.svelte";
import type { Opponent } from "$lib/state/opponent";
import { wsUrl } from "$lib/state/ws-url";

async function fetchTicket(): Promise<string> {
  const res = await fetch("/api/ws-ticket");
  if (!res.ok) throw new Error(`ws-ticket: ${res.status}`);
  const { ticket } = (await res.json()) as { ticket: string };
  return ticket;
}

export class PlayerOpponent implements Opponent {
  private ws: WebSocket | null = null;

  start(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let ticket: string;
      try {
        ticket = await fetchTicket();
      } catch (e) {
        reject(e);
        return;
      }
      const ws = new WebSocket(wsUrl(), [`ticket.${ticket}`]);
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
            game.lastMove = { from: msg.from, to: msg.to, promotion: msg.promotion };
            break;
          case "turn":
            game.turn = msg.color;
            break;
          case "game_over":
            game.status = "ended";
            game.result = { winner: msg.result, reason: msg.reason };
            break;
          case "opponent_left":
            game.status = "ended";
            game.result = { winner: "opponent_left", reason: "disconnect" };
            break;
          default:
            console.warn("unknown message", msg);
        }
      };
    });
  }

  sendMove(from: string, to: string, promotion?: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("not connected");
      return;
    }
    this.ws.send(JSON.stringify({ type: "move", from, to, promotion }));
  }

  stop(): void {
    this.ws?.close();
    this.ws = null;
  }
}
