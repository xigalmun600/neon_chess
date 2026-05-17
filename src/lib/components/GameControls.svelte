<script lang="ts">
  import { game } from "$lib/state/game.svelte";
  import type { Opponent } from "$lib/state/opponent";
  import { m } from "$lib/paraglide/messages";

  let {
    opponent,
    mode,
  }: { opponent: Opponent; mode: "human" | "machine" } = $props();

  function onResign() {
    if (!confirm(m.controls_resignConfirm())) return;
    opponent.resign();
  }

  function onOfferDraw() {
    opponent.offerDraw?.();
  }

  function onAcceptDraw() {
    opponent.acceptDraw?.();
  }

  function onDeclineDraw() {
    opponent.declineDraw?.();
  }
</script>

{#if game.status === "match"}
  <div class="flex w-full flex-wrap items-center justify-center gap-2">
    {#if game.drawOfferFrom === "opponent"}
      <span class="text-xs uppercase tracking-widest text-gray-400"
        >{m.controls_drawOffered()}</span
      >
      <button
        type="button"
        onclick={onAcceptDraw}
        class="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20"
      >
        {m.controls_accept()}
      </button>
      <button
        type="button"
        onclick={onDeclineDraw}
        class="rounded-lg border border-border-muted bg-surface-light px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-300 transition hover:bg-surface-dark"
      >
        {m.controls_decline()}
      </button>
    {:else}
      {#if mode === "human"}
        <button
          type="button"
          onclick={onOfferDraw}
          disabled={game.drawOfferFrom !== null}
          class="rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary transition hover:bg-secondary/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {m.controls_offerDraw()}
        </button>
        {#if game.drawOfferFrom === "me"}
          <span class="text-xs italic text-gray-400">{m.controls_offerSent()}</span>
        {/if}
      {/if}
      <button
        type="button"
        onclick={onResign}
        class="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 transition hover:bg-red-500/20"
      >
        {m.controls_resign()}
      </button>
    {/if}
  </div>
{/if}
