<script lang="ts">
  // svelte libs
  import { onMount } from "svelte";
  import { game } from "$lib/state/game.svelte";
  import {
    rhythm,
    queueMove,
    consumeQueued,
    clearQueued,
    getBeatTime,
  } from "$lib/state/rhythm.svelte";
  import type { HitGrade } from "$lib/state/game.svelte";
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

  const opposite = (c: "white" | "black") =>
    c === "white" ? "black" : "white";

  const updateBoard = () => {
    const turnColor = chess.turn() === "w" ? "white" : "black";

    if (rhythmMode && game.color) {
      const isMyLogicalTurn = turnColor === game.color;
      cg.set({
        fen: chess.fen(),
        turnColor: isMyLogicalTurn ? opposite(game.color) : turnColor,
        movable: {
          color: isMyLogicalTurn ? game.color : undefined,
          dests: new Map(),
        },
        premovable: {
          enabled: isMyLogicalTurn,
          customDests: isMyLogicalTurn ? getLegalMoves() : undefined,
        },
      });
    } else {
      const myTurn =
        (game.color === "white" && chess.turn() === "w") ||
        (game.color === "black" && chess.turn() === "b");
      cg.set({
        fen: chess.fen(),
        turnColor,
        movable: {
          color: myTurn ? game.color! : undefined,
          dests: myTurn ? getLegalMoves() : new Map(),
        },
      });
    }

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
    if (rhythmMode) cg.cancelPremove();
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
            chess.move({ from, to, promotion });
            opponent.sendMove(from, to, promotion);
            updateBoard();
          },
        },
      },
      premovable: {
        enabled: false,
        showDests: true,
        events: {
          set: (from, to) => {
            if (!rhythmMode || !game.color) return;
            const promotion = isPromotion(from, to) ? "q" : undefined;
            queueMove(game.color, { from, to, promotion });
          },
          unset: () => {
            if (!rhythmMode || !game.color) return;
            clearQueued(game.color);
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

  const gradeError = (
    errorMs: number,
  ): { grade: HitGrade; points: number } => {
    if (errorMs <= 80) return { grade: "perfect", points: 100 };
    if (errorMs <= 200) return { grade: "great", points: 60 };
    if (errorMs <= 400) return { grade: "good", points: 30 };
    return { grade: "ok", points: 10 };
  };

  $effect(() => {
    if (!rhythmMode || !cg) return;
    const idx = rhythm.currentBeatIndex;
    if (idx <= lastSeenBeatIndex) return;
    for (let i = lastSeenBeatIndex; i < idx; i++) {
      const beatColor = i % 2 === 0 ? "white" : "black";
      const result = consumeQueued(beatColor);
      if (result) {
        if (beatColor === game.color) {
          const beatTime = getBeatTime(i);
          if (beatTime != null) {
            const errorMs = Math.abs(beatTime - result.queuedAt) * 1000;
            const { grade, points } = gradeError(errorMs);
            game.score += points;
            game.lastHit = { grade, points, errorMs };
            game.lastHitAt = Date.now();
          }
        }
        applyMove(result.move);
        if (beatColor === game.color) {
          opponent.sendMove(
            result.move.from,
            result.move.to,
            result.move.promotion,
          );
        }
      }
    }
    lastSeenBeatIndex = idx;
  });
</script>

<div bind:this={el} style="width: 700px; height: 700px"></div>
