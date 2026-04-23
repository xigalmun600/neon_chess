<script lang="ts">
  import "../../app.css";
  import { page } from "$app/state";
  import Status from "$lib/components/Status.svelte";
  import Board from "$lib/components/Board.svelte";

  const mode = $derived(page.url.searchParams.get("mode"));
</script>

<main class="flex min-h-screen flex-col items-center justify-center">
  {#if mode === "human" || mode === "machine"}
    <Status />
    <Board />
  {:else}
    <p class="mt-10 text-red-400">
      Invalid mode: expected ?mode=human or ?mode=machine
    </p>
  {/if}
</main>
