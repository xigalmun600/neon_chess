import { wsUrl } from "$lib/state/ws-url";

export type WsMessage =
  | { type: "finding" }
  | { type: "match"; color: "white" | "black"; opponent?: string | null }
  | { type: "move"; from: string; to: string; promotion?: string }
  | { type: "turn"; color: "white" | "black" }
  | {
      type: "game_over";
      result: "white" | "black" | "draw" | "opponent_left";
      reason: string;
    }
  | { type: "opponent_left" }
  | { type: "draw_offered" }
  | { type: "draw_declined" }
  | { type: "draw_withdrawn" }
  | { type: "chat"; text: string; from?: string }
  | { type: "invite_received"; inviteId: string; fromId: number; fromUsername: string }
  | { type: "invite_sent"; inviteId: string; toId: number; toUsername?: string }
  | { type: "invite_declined"; inviteId: string }
  | { type: "invite_cancelled"; inviteId: string }
  | { type: "invite_expired"; inviteId: string }
  | { type: "invite_error"; reason: string };

type Listener = (msg: WsMessage) => void;

let ws: WebSocket | null = null;
let connecting: Promise<void> | null = null;
const listeners = new Set<Listener>();

async function fetchTicket(): Promise<string> {
  const res = await fetch("/api/ws-ticket");
  if (!res.ok) throw new Error(`ws-ticket: ${res.status}`);
  const { ticket } = (await res.json()) as { ticket: string };
  return ticket;
}

export function connect(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve();
  if (connecting) return connecting;
  connecting = (async () => {
    let ticket: string;
    try {
      ticket = await fetchTicket();
    } catch (e) {
      connecting = null;
      throw e;
    }
    return new Promise<void>((resolve, reject) => {
      const sock = new WebSocket(wsUrl(), [`ticket.${ticket}`]);
      ws = sock;
      sock.onopen = () => {
        connecting = null;
        resolve();
      };
      sock.onerror = (e) => {
        connecting = null;
        reject(e);
      };
      sock.onclose = () => {
        if (ws === sock) ws = null;
        connecting = null;
      };
      sock.onmessage = (e) => {
        let msg: WsMessage;
        try {
          msg = JSON.parse(e.data) as WsMessage;
        } catch {
          return;
        }
        if (!msg || typeof msg.type !== "string") return;
        for (const l of listeners) {
          try {
            l(msg);
          } catch (err) {
            console.error("ws listener threw", err);
          }
        }
      };
    });
  })();
  return connecting;
}

export function disconnect(): void {
  ws?.close();
  ws = null;
  connecting = null;
}

export function send(msg: object): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("ws not connected");
    return;
  }
  ws.send(JSON.stringify(msg));
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN;
}
