import { writable } from "svelte/store";

export type Chat = string[];
export const connected = writable(false);

let ws: WebSocket;

export function connect() {
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => connected.set(true);
  ws.onclose = () => connected.set(false);

  ws.onmessage = (event) => {
    const msg = event.data;
    console.log(msg);
  };
}

export function send(msg: object) {
  if(!ws) {
    console.warn("not connected");
    return;
  }
  ws.send(JSON.stringify(msg));
}
