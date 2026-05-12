<script lang="ts">
  import "../../app.css";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/state";
  import Status from "$lib/components/Status.svelte";
  import Board from "$lib/components/Board.svelte";
  import Chat from "$lib/components/Chat.svelte";
  import MatchHeader from "$lib/components/MatchHeader.svelte";
  import MoveList from "$lib/components/MoveList.svelte";
  import type { Opponent } from "$lib/state/opponent";
  import { PlayerOpponent } from "$lib/state/player-opponent";
  import { MachineOpponent } from "$lib/state/machine-opponent";
  import { resetGame } from "$lib/state/game.svelte";

  const mode = page.url.searchParams.get("mode");

  let opponent: Opponent | null = $state(null);
  let playerOpponent: PlayerOpponent | null = $state(null);

  onMount(async () => {
    if (mode === "human") {
      const p = new PlayerOpponent();
      playerOpponent = p;
      opponent = p;
      await p.start();
    } else if (mode === "machine") {
      opponent = new MachineOpponent({ skillLevel: 1, moveTimeMs: 800 });
      await opponent.start();
    }
  });

  onDestroy(() => {
    opponent?.stop();
    resetGame();
  });
</script>

<main class="mx-auto w-full max-w-[1600px] px-4 py-6">
  {#if mode !== "human" && mode !== "machine"}
    <p class="mt-10 text-center text-red-400">
      Invalid mode: expected ?mode=human or ?mode=machine
    </p>
  {:else if mode === "human" && opponent && playerOpponent}
    <MatchHeader />
    <div
      class="grid gap-4 lg:grid-cols-[18rem_minmax(auto,_700px)_18rem] lg:items-start lg:justify-center"
    >
      <Chat opponent={playerOpponent} />
      <div class="flex flex-col items-center">
        <Status />
        <Board {opponent} />
      </div>
      <MoveList />
    </div>
  {:else if mode === "machine" && opponent}
    <div class="flex flex-col items-center">
      <Status />
      <Board {opponent} />
    </div>
  {:else}
    <p class="mt-10 text-center">Loading…</p>
  {/if}
</main>
