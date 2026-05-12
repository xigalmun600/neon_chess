<script lang="ts">
  import { page } from "$app/state";
  import { game } from "$lib/state/game.svelte";

  const myName = $derived(page.data.user?.username ?? "you");
  const myColor = $derived(game.color);
  const opponentColor = $derived(
    game.color === "white" ? "black" : game.color === "black" ? "white" : null,
  );

  const colorClass = (c: "white" | "black" | null) =>
    c === "white"
      ? "text-primary"
      : c === "black"
        ? "text-secondary"
        : "text-gray-400";
</script>

{#if game.opponentName && myColor}
  <div
    class="mx-auto mb-4 flex w-fit items-center gap-3 rounded-lg border border-border-muted bg-surface-dark/80 px-4 py-2 backdrop-blur-md"
  >
    <span class="font-bold {colorClass(myColor)}">{myName}</span>
    <span class="text-xs uppercase tracking-widest text-gray-500"
      >({myColor})</span
    >
    <span class="text-gray-500">vs</span>
    <span class="text-xs uppercase tracking-widest text-gray-500"
      >({opponentColor})</span
    >
    <span class="font-bold {colorClass(opponentColor)}">{game.opponentName}</span
    >
  </div>
{/if}
