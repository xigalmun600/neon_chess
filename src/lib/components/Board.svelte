<script lang="ts">
  import { onMount } from "svelte";
  import { Chess, SQUARES } from "chess.js";
  import { Chessground } from "chessground";
  import "chessground/assets/chessground.base.css";
  import "chessground/assets/chessground.brown.css";
  import "chessground/assets/chessground.cburnett.css";
  import type { Key, Dests } from "chessground/types";
  
  let el: HTMLDivElement;

  onMount(() => {
    const chess = new Chess();

    const getLegalMoves = () => {
      const legalMoves = new Map<Key, Key[]>();
      console.log(chess.moves({ verbose: true }));

      for (const { from, to } of chess.moves({ verbose: true })) {
        const existing = legalMoves.get(from) ?? [];
        legalMoves.set(from, [...existing, to]);
      }

      return legalMoves;
    };

    const cg = Chessground(el, {
      movable: {
        free: false,
        dests: getLegalMoves(),
        events: {
          after: (ori, dest) => {
            console.log(ori, dest);
            chess.move({ from: ori, to: dest });
            cg.set({ movable: { dests: getLegalMoves() } });
          },
        },
      },
    });

    return cg;
  });
</script>

<div bind:this={el} style="width: 700px; height: 700px"></div>
