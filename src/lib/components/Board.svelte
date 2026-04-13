<script lang="ts">
  import { onMount } from "svelte";
  import { game, send } from "$lib/state/socket.svelte";
  import { Chess } from "chess.js";
  import type { Api } from "chessground/api";
  import type { Key } from "chessground/types";
  import { Chessground } from "chessground";
  import "chessground/assets/chessground.base.css";
  import "chessground/assets/chessground.brown.css";
  import "chessground/assets/chessground.cburnett.css";

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
      (game.color === "white" && chess.turn() === "w") ||
      (game.color === "black" && chess.turn() === "b");
    const turnColor = chess.turn() === "w" ? "white" : "black";

    cg.set({
      turnColor,
      movable: {
        color: myTurn ? game.color! : undefined,
        dests: myTurn ? getLegalMoves() : new Map(),
      },
    });
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
            chess.move({ from, to });
            send({ type: "move", from, to });
            updateBoard();
          },
        },
      },
    });
  });

  $effect(() => {
    if (cg && game.color) {
      cg.set({ orientation: game.color });
      updateBoard();
    }
  });

  $effect(() => {
    if (cg && game.lastMove) {
      chess.move({ from: game.lastMove.from, to: game.lastMove.to });
      cg.move(game.lastMove.from as Key, game.lastMove.to as Key);
      updateBoard();
    }
  });
</script>

<div bind:this={el} style="width: 700px; height: 700px"></div>
