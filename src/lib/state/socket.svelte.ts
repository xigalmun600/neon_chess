type Status = "off" | "on" | "find" | "match";

export const game = $state({
  status: "off" as Status,
  color: null as "white" | "black" | null,
  turn: false,
  lastMove: null as { from: string, to: string } | null,
});

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
    game.status = "on";
    send({ "type": "find_match" });
  }
  ws.onclose = () => game.status = "off";

  ws.onmessage = (packet) => {
    const msg = JSON.parse(packet.data);
    console.log(msg);
    switch (msg.type) {
      case "finding":
        game.status = "find";
        break;
      case "match":
        game.status = "match";
        game.color = msg.color;
        break;
      case "move":
        game.lastMove = { from: msg.from, to: msg.to };
        console.log(msg);
        break;
      default:
        console.warn("Unknown data received");
    }
  };
}
