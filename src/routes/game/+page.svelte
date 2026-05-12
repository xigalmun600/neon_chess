<script lang="ts">
  import "../../app.css";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import Status from "$lib/components/Status.svelte";
  import Board from "$lib/components/Board.svelte";
  import Chat from "$lib/components/Chat.svelte";
  import MatchHeader from "$lib/components/MatchHeader.svelte";
  import MoveList from "$lib/components/MoveList.svelte";
  import GameOverModal from "$lib/components/GameOverModal.svelte";
  import type { Opponent } from "$lib/state/opponent";
  import { PlayerOpponent } from "$lib/state/player-opponent";
  import { MachineOpponent } from "$lib/state/machine-opponent";
  import { game, resetGame } from "$lib/state/game.svelte";

  const rawMode = page.url.searchParams.get("mode");
  const mode: "human" | "machine" | null =
    rawMode === "human" || rawMode === "machine" ? rawMode : null;

  let opponent: Opponent | null = $state(null);
  let playerOpponent: PlayerOpponent | null = $state(null);

  async function startGame() {
    if (mode === "human") {
      const p = new PlayerOpponent();
      playerOpponent = p;
      opponent = p;
      await p.start();
    } else if (mode === "machine") {
      const m = new MachineOpponent({ skillLevel: 1, moveTimeMs: 800 });
      opponent = m;
      await m.start();
    }
  }

  async function onPlayAgain() {
    opponent?.stop();
    opponent = null;
    playerOpponent = null;
    resetGame();
    await startGame();
  }

  async function onHome() {
    opponent?.stop();
    opponent = null;
    playerOpponent = null;
    resetGame();
    await goto("/");
  }

  onMount(startGame);

  onDestroy(() => {
    opponent?.stop();
    resetGame();
  });
</script>

<main class="mx-auto w-full max-w-[1600px] px-4 py-6">
  {#if mode === null}
    <p class="mt-10 text-center text-red-400">
      Invalid mode: expected ?mode=human or ?mode=machine
    </p>
  {:else if opponent}
    <MatchHeader />
    <div class="mb-4 text-center text-xs uppercase tracking-widest text-gray-400">
      <Status />
    </div>
    <div
      class="grid gap-4 lg:grid-cols-[18rem_minmax(0,_700px)_18rem] lg:items-start lg:justify-center"
    >
      {#if mode === "human" && playerOpponent}
        <div class="lg:order-1 lg:col-start-1 lg:row-start-1">
          <Chat opponent={playerOpponent} />
        </div>
      {/if}
      <div
        class="relative flex w-full flex-col items-center lg:order-2 lg:col-start-2 lg:row-start-1 lg:w-auto"
      >
        <Board {opponent} />
        {#if game.status === "ended" && game.result}
          <GameOverModal {onPlayAgain} {onHome} />
        {/if}
      </div>
      <div class="lg:order-3 lg:col-start-3 lg:row-start-1">
        <MoveList {opponent} {mode} />
      </div>
    </div>
  {:else}
    <p class="mt-10 text-center">Loading…</p>
  {/if}
</main>
