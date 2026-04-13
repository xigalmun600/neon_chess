<script lang="ts">
  import { onMount } from "svelte";
  import { Chessground } from "chessground";
  import "chessground/assets/chessground.base.css";
  import "chessground/assets/chessground.brown.css";
  import "chessground/assets/chessground.cburnett.css";

  let el: HTMLDivElement;

  onMount(() => {
    const cg = Chessground(el, {
      // config
    });
  });
</script>

<div bind:this={el} style="width: 400px; height: 400px"></div>
