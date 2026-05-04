<script lang="ts">
  // svelte libs
  import { onMount } from "svelte";
  import { game } from "$lib/state/game.svelte";
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

  let { opponent }: { opponent: Opponent } = $props();

  let el: HTMLDivElement;
  let cg: Api;

  const chess = new Chess();

  const isPromotion = (from: string, to: string) => {
    const piece = chess.get(from as never);
    if (!piece || piece.type !== "p") return false;
    return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
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

    cg.set({
      fen: chess.fen(),
      turnColor,
      movable: {
        color: myTurn ? game.color! : undefined,
        dests: myTurn ? getLegalMoves() : new Map(),
      },
    });

    game.turn = turnColor;
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
    if (cg && game.lastMove) {
      const { from, to, promotion } = game.lastMove;
      chess.move({ from, to, promotion });
      cg.move(from as Key, to as Key);
      updateBoard();
    }
  });
</script>

<div bind:this={el} style="width: 700px; height: 700px"></div>
