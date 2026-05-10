export function wsUrl(): string {
  if (window.location.hostname === "localhost") {
    return "ws://localhost:8080";
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}
