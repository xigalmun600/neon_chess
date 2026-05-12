import {
  BOARDS,
  PIECES,
  DEFAULT_BOARD,
  DEFAULT_PIECE,
} from "$lib/state/theme-catalog";

export { BOARDS, PIECES, DEFAULT_BOARD, DEFAULT_PIECE };

export const theme = $state({
  board: DEFAULT_BOARD,
  piece: DEFAULT_PIECE,
});

const STORAGE_KEY = "theme";

export function setTheme(t: { board?: string; piece?: string }): void {
  if (t.board && BOARDS[t.board]) theme.board = t.board;
  if (t.piece && PIECES[t.piece]) theme.piece = t.piece;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }
}

export function hydrateTheme(
  fromUser?: { boardTheme?: string; pieceTheme?: string } | null,
): void {
  let cached: { board?: string; piece?: string } = {};
  if (typeof window !== "undefined") {
    try {
      cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
      cached = {};
    }
  }

  if (fromUser?.boardTheme && BOARDS[fromUser.boardTheme]) {
    theme.board = fromUser.boardTheme;
  } else if (cached.board && BOARDS[cached.board]) {
    theme.board = cached.board;
  }

  if (fromUser?.pieceTheme && PIECES[fromUser.pieceTheme]) {
    theme.piece = fromUser.pieceTheme;
  } else if (cached.piece && PIECES[cached.piece]) {
    theme.piece = cached.piece;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }
}
