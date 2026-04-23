<script lang="ts">
  import { game } from "$lib/state/game.svelte";
</script>

<p>
  Status:
{#if game.status === "on"}
  on
{:else if game.status === "find"}
  find
{:else if game.status === "match" }
  playing
{:else }
  off
{/if}
</p>
