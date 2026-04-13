<script lang="ts">
  import Board from "$lib/components/Board.svelte";
  import { game, send } from "$lib/state/socket.svelte";
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
  <p>
    {#if game.status == "off"}
      disconnected
    {:else if game.status == "on"}
      connected
    {:else if game.status == "find"}
      finding
    {:else}
      match
    {/if}
  </p>
  <Board />
</main>
