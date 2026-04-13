<script lang="ts">
  import Board from "$lib/components/Board.svelte";
  import { status, send } from "$lib/stores/socket";
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
  <p>
    {#if $status == "off"}
      disconnected
    {:else if $status == "on"}
      connected
    {:else if $status == "find"}
      finding
    {:else}
      match
    {/if}
  </p>
  <Board />
</main>
