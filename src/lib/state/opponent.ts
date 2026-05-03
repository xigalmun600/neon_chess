export type Color = "white" | "black";

export interface Opponent {
  start(): Promise<void>;
  sendMove(from: string, to: string, promotion?: string): void;
  stop(): void;
}
