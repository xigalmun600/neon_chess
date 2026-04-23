type Status = "off" | "on" | "find" | "match";
type Color = "white" | "black";

export const game = $state({
  status: "off" as Status,
  color: null as Color | null,
  turn: null as Color | null,
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
        game.turn = "white";
        break;
      case "move":
        game.lastMove = { from: msg.from, to: msg.to };
        break;
      case "turn":
        game.turn = msg.color;
        break;
      default:
        console.warn("Unknown data received");
    }
  };
}
