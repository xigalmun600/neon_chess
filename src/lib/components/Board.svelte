<script lang="ts">
  // svelte libs
  import { onMount } from "svelte";
  import { game } from "$lib/state/game.svelte";
  import {
    rhythm,
    queueMove,
    consumeQueued,
  } from "$lib/state/rhythm.svelte";
  import type { Opponent } from "$lib/state/opponent";
  // chess.js libs
  import { Chess } from "chess.js";
  // chessground libs
  import type { Api } from "chessground/api";
  import type { Key } from "chessground/types";
  import { Chessground } from "chessground";
  import "$lib/assets/boards/chessground.base.css";
  import "$lib/assets/boards/chessground.neon.css";
  import "$lib/assets/pieces/chessground.kiwen-suwi-neon-glowy.css";

  let {
    opponent,
    rhythmMode = false,
  }: { opponent: Opponent; rhythmMode?: boolean } = $props();

  let el: HTMLDivElement;
  let cg: Api;

  const chess = new Chess();
  let lastSeenHistoryLength = 0;
  let lastSeenBeatIndex = 0;

  const isPromotion = (from: string, to: string) => {
    const piece = chess.get(from as never);
    if (!piece || piece.type !== "p") return false;
    return (
      (piece.color === "w" && to[1] === "8") ||
      (piece.color === "b" && to[1] === "1")
    );
  };

  const getLegalMoves = () => {
    const legalMoves = new Map<Key, Key[]>();
    for (const { from, to } of chess.moves({ verbose: true })) {
      const existing = legalMoves.get(from as Key) ?? [];
      legalMoves.set(from as Key, [...existing, to as Key]);
    }
    return legalMoves;
  };

  const updateBoard = () => {
    const myTurn =
      (game.color === "white" && chess.turn() === "w") ||
      (game.color === "black" && chess.turn() === "b");
    const turnColor = chess.turn() === "w" ? "white" : "black";

    const queuedForMe =
      rhythmMode && game.color
        ? game.color === "white"
          ? rhythm.whiteQueued
          : rhythm.blackQueued
        : null;

    cg.set({
      fen: chess.fen(),
      turnColor,
      movable: {
        color: myTurn ? game.color! : undefined,
        dests: myTurn ? getLegalMoves() : new Map(),
      },
      lastMove: queuedForMe
        ? [queuedForMe.from as Key, queuedForMe.to as Key]
        : undefined,
    });

    game.turn = turnColor;

    const historyLength = chess.history().length;
    if (historyLength > lastSeenHistoryLength) {
      lastSeenHistoryLength = historyLength;
      game.lastMoveColor = chess.turn() === "w" ? "black" : "white";
      game.moveCount = historyLength;
    }
  };

  const applyMove = (move: { from: string; to: string; promotion?: string }) => {
    chess.move(move);
    cg.move(move.from as Key, move.to as Key);
    updateBoard();
  };

  onMount(() => {
    cg = Chessground(el, {
      orientation: game.color ?? "white",
      movable: {
        free: false,
        color: undefined,
        dests: new Map(),
        events: {
          after: (from, to) => {
            const promotion = isPromotion(from, to) ? "q" : undefined;
            if (rhythmMode) {
              if (game.color) {
                queueMove(game.color, { from, to, promotion });
              }
              cg.set({
                fen: chess.fen(),
                lastMove: [from as Key, to as Key],
              });
            } else {
              chess.move({ from, to, promotion });
              opponent.sendMove(from, to, promotion);
              updateBoard();
            }
          },
        },
      },
    });
    if (game.color) updateBoard();
  });

  $effect(() => {
    if (cg && game.color) {
      cg.set({ orientation: game.color });
      updateBoard();
    }
  });

  $effect(() => {
    if (cg && game.lastMove && !rhythmMode) {
      const { from, to, promotion } = game.lastMove;
      chess.move({ from, to, promotion });
      cg.move(from as Key, to as Key);
      updateBoard();
    }
  });

  $effect(() => {
    if (!rhythmMode || !cg) return;
    const idx = rhythm.currentBeatIndex;
    if (idx <= lastSeenBeatIndex) return;
    for (let i = lastSeenBeatIndex; i < idx; i++) {
      const beatColor = i % 2 === 0 ? "white" : "black";
      const queued = consumeQueued(beatColor);
      if (queued) {
        applyMove(queued);
        if (beatColor === game.color) {
          opponent.sendMove(queued.from, queued.to, queued.promotion);
        }
      }
    }
    lastSeenBeatIndex = idx;
  });
</script>

<div bind:this={el} style="width: 700px; height: 700px"></div>
