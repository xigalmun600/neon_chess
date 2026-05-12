<script lang="ts">
  import { game } from "$lib/state/game.svelte";

  let listEl: HTMLDivElement;

  const pairs = $derived.by(() => {
    const out: { num: number; white: string; black: string | null }[] = [];
    for (let i = 0; i < game.moves.length; i += 2) {
      out.push({
        num: i / 2 + 1,
        white: game.moves[i],
        black: game.moves[i + 1] ?? null,
      });
    }
    return out;
  });

  $effect(() => {
    void game.moves.length;
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
  });
</script>

<div
  class="flex h-[700px] flex-col rounded-xl border border-border-muted bg-surface-dark/80 p-3 backdrop-blur-md"
>
  <h4
    class="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-gray-400"
  >
    Move list
  </h4>
  <div bind:this={listEl} class="flex-1 overflow-y-auto pr-1">
    {#if pairs.length === 0}
      <p class="mt-4 text-center text-xs text-gray-500">No moves yet.</p>
    {:else}
      <ol class="font-mono text-sm">
        {#each pairs as p (p.num)}
          <li
            class="grid grid-cols-[2.5rem_1fr_1fr] gap-2 rounded px-1 py-0.5 odd:bg-surface-light/30"
          >
            <span class="text-right text-gray-500">{p.num}.</span>
            <span class="text-primary">{p.white}</span>
            <span class="text-secondary">{p.black ?? ""}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</div>
