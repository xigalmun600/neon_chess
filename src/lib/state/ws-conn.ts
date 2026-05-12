import { wsUrl } from "$lib/state/ws-url";

type Listener = (msg: any) => void;

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
        let msg: any;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
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
