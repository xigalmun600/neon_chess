import { writable } from "svelte/store";

export type Chat = string[];
export const connected = writable(false);
export const chatlog = writable<Chat>([]);

let ws: WebSocket;

export function connect() {
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => connected.set(true);
  ws.onclose = () => connected.set(false);

  ws.onmessage = (event) => {
    const msg = event.data;
    chatlog.update(current => [...current, msg]);
  };
}

export function send(msg: string) {
  ws.send(msg);
}
