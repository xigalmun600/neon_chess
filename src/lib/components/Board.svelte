<script lang="ts">
  import { onMount } from "svelte";
  import { Chess } from "chess.js";
  import { Chessground } from "chessground";
  import type { Api } from "chessground/api";
  import "chessground/assets/chessground.base.css";
  import "chessground/assets/chessground.brown.css";
  import "chessground/assets/chessground.cburnett.css";
  import type { Key } from "chessground/types";
  import { color, send, lastMove } from "$lib/stores/socket";

  let el: HTMLDivElement;
  let cg: Api;

  const chess = new Chess();

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
      ($color === "white" && chess.turn() === "w") ||
      ($color === "black" && chess.turn() === "b");
    const turnColor = chess.turn() === "w" ? "white" : "black";

    cg.set({
      turnColor,
      movable: {
        color: myTurn ? $color! : undefined,
        dests: myTurn ? getLegalMoves() : new Map(),
      },
    });
  };

  onMount(() => {
    cg = Chessground(el, {
      orientation: $color ?? "white",
      movable: {
        free: false,
        color: undefined,
        dests: new Map(),
        events: {
          after: (from, to) => {
            if (applyingOpponentMove) return;
            chess.move({ from, to });
            send({ type: "move", from, to });
            updateBoard();
          },
        },
      },
    });
  });

  $effect(() => {
    if (cg && $color) {
      cg.set({ orientation: $color });
      updateBoard();
    }
  });

  let applyingOpponentMove = false;

  $effect(() => {
    if (cg && $lastMove) {
      applyingOpponentMove = true;
      chess.move({ from: $lastMove.from, to: $lastMove.to });
      cg.move($lastMove.from as Key, $lastMove.to as Key);
      applyingOpponentMove = false;
      updateBoard();
    }
  });
</script>

<div bind:this={el} style="width: 700px; height: 700px"></div>
