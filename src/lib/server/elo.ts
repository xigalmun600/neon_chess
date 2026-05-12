export type GameResult = "white" | "black" | "draw";

const K = 32;

function expected(self: number, opp: number): number {
  return 1 / (1 + Math.pow(10, (opp - self) / 400));
}

export function computeElo(
  whiteElo: number,
  blackElo: number,
  result: GameResult,
): { whiteAfter: number; blackAfter: number } {
  const whiteActual = result === "white" ? 1 : result === "draw" ? 0.5 : 0;
  const blackActual = 1 - whiteActual;

  const whiteAfter = Math.round(
    whiteElo + K * (whiteActual - expected(whiteElo, blackElo)),
  );
  const blackAfter = Math.round(
    blackElo + K * (blackActual - expected(blackElo, whiteElo)),
  );

  return { whiteAfter, blackAfter };
}
