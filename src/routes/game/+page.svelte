<script lang="ts">
  import "../../app.css";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/state";
  import Status from "$lib/components/Status.svelte";
  import Board from "$lib/components/Board.svelte";
  import BeatTimers from "$lib/components/BeatTimers.svelte";
  import StartOverlay from "$lib/components/StartOverlay.svelte";
  import type { Opponent } from "$lib/state/opponent";
  import { PlayerOpponent } from "$lib/state/player-opponent";
  import { MachineOpponent } from "$lib/state/machine-opponent";
  import { game, resetGame } from "$lib/state/game.svelte";
  import {
    loadTrack,
    queueMove,
    start as startRhythm,
    stop as stopRhythm,
  } from "$lib/state/rhythm.svelte";

  const mode = page.url.searchParams.get("mode");
  const isRhythm = mode === "machine";

  let opponent: Opponent | null = $state(null);
  let beats: number[] = $state([]);
  let rhythmStarted = $state(false);
  let audio: HTMLAudioElement | null = null;
  let lastQueuedLastMove: typeof game.lastMove = null;

  onMount(async () => {
    if (mode === "human") {
      opponent = new PlayerOpponent();
      await opponent.start();
    } else if (mode === "machine") {
      opponent = new MachineOpponent({ skillLevel: 1, moveTimeMs: 50 });
      await opponent.start();
      const track = await loadTrack("/music/funk-infernal.json");
      beats = track.beats;
    }
  });

  $effect(() => {
    if (!isRhythm || !rhythmStarted) return;
    const lm = game.lastMove;
    if (!lm || lm === lastQueuedLastMove) return;
    lastQueuedLastMove = lm;
    queueMove("black", lm);
  });

  function start() {
    if (rhythmStarted || beats.length === 0) return;
    audio = new Audio("/music/funk-infernal.mp3");
    audio.preload = "auto";
    audio
      .play()
      .then(() => {
        startRhythm(audio!, beats, () => {});
        rhythmStarted = true;
      })
      .catch((err) => {
        console.error("audio play failed", err);
      });
  }

  onDestroy(() => {
    if (isRhythm) {
      stopRhythm();
      audio?.pause();
      audio = null;
    }
    opponent?.stop();
    resetGame();
  });
</script>

<main class="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center">
  {#if mode !== "human" && mode !== "machine"}
    <p class="mt-10 text-red-400">
      Invalid mode: expected ?mode=human or ?mode=machine
    </p>
  {:else if opponent}
    {#if isRhythm && !rhythmStarted}
      <StartOverlay onstart={start} />
    {/if}
    {#if isRhythm}
      <BeatTimers />
    {/if}
    <Status />
    <Board {opponent} rhythmMode={isRhythm} />
  {:else}
    <p class="mt-10">Loading…</p>
  {/if}
</main>
