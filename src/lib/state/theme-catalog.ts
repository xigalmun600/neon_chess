const boardCssUrls = import.meta.glob<string>(
  "../assets/boards/chessground.*.css",
  { query: "?url", import: "default", eager: true },
);
const pieceCssUrls = import.meta.glob<string>(
  "../assets/pieces/chessground.*.css",
  { query: "?url", import: "default", eager: true },
);

function buildCatalog(
  record: Record<string, string>,
  exclude: string[] = [],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(record)) {
    const name = path.replace(/.*chessground\./, "").replace(/\.css$/, "");
    if (exclude.includes(name)) continue;
    out[name] = url;
  }
  return out;
}

export const BOARDS = buildCatalog(boardCssUrls, ["base"]);
export const PIECES = buildCatalog(pieceCssUrls);

export const DEFAULT_BOARD = "neon";
export const DEFAULT_PIECE = "kiwen-suwi-neon-glowy";
