import { writable } from "svelte/store";

type Status = "off" | "on" | "find" | "match";
export const status = writable<Status>("off");
export const color = writable<"white" | "black" | null>(null);
export const turn = writable<boolean>(false);
export const lastMove = writable<{ from: string, to: string } | null>(null);

let ws: WebSocket;

export function send(msg: object) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("not connected");
    return;
  }
  ws.send(JSON.stringify(msg));
}

export function connect() {
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => {
    status.set("on");
    send({ "type": "find_match" });
  }
  ws.onclose = () => status.set("off");

  ws.onmessage = (packet) => {
    const msg = JSON.parse(packet.data);
    console.log(msg);
    switch (msg.type) {
      case "finding":
        status.set("find");
        break;
      case "match":
        status.set("match");
        color.set(msg.color);
        break;
      case "move":
        lastMove.set({ from: msg.from, to: msg.to });
        console.log(msg);
        break;
      default:
        console.warn("Unknown data received");
    }
  };
}
