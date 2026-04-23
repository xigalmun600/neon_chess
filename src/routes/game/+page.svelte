<script lang="ts">
  import "../../app.css";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/state";
  import Status from "$lib/components/Status.svelte";
  import Board from "$lib/components/Board.svelte";
  import type { Opponent } from "$lib/state/opponent";
  import { PlayerOpponent } from "$lib/state/player-opponent";
  import { resetGame } from "$lib/state/game.svelte";

  const mode = page.url.searchParams.get("mode");

  let opponent: Opponent | null = $state(null);

  onMount(async () => {
    if (mode === "human") {
      opponent = new PlayerOpponent();
    } else if (mode === "machine") {
      console.warn("machine mode not implemented :v");
      return;
    } else {
      return;
    }
    await opponent.start();
  });

  onDestroy(() => {
    opponent?.stop();
    resetGame();
  });
</script>

<main class="flex min-h-screen flex-col items-center justify-center">
  {#if mode !== "human" && mode !== "machine"}
    <p class="mt-10 text-red-400">
      Invalid mode: expected ?mode=human or ?mode=machine
    </p>
  {:else if opponent}
    <Status />
    <Board {opponent} />
  {:else}
    <p class="mt-10">Loading…</p>
  {/if}
</main>
