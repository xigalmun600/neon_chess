<script lang="ts">
  import { enhance } from "$app/forms";
  import { theme, setTheme } from "$lib/state/theme.svelte";
  import { m } from "$lib/paraglide/messages";

  let { data, form } = $props();

  let board = $state(data.user.boardTheme);
  let piece = $state(data.user.pieceTheme);

  function onBoardChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    board = v;
    setTheme({ board: v });
  }

  function onPieceChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    piece = v;
    setTheme({ piece: v });
  }
</script>

<main class="mx-auto w-full max-w-2xl px-6 py-10">
  <h1
    class="mb-2 text-3xl font-bold uppercase tracking-widest text-primary"
    style="text-shadow: 0 0 12px rgba(0, 255, 255, 0.5);"
  >
    {m.settings_heading()}
  </h1>
  <p class="mb-8 text-sm uppercase tracking-widest text-gray-400">
    {m.settings_subheading()}
  </p>

  <form
    method="POST"
    action="?/update"
    use:enhance={() =>
      ({ update }) =>
        update({ reset: false })}
    class="flex flex-col gap-6 rounded-xl border border-border-muted bg-surface-dark/80 p-6 backdrop-blur-md"
  >
    <div class="flex flex-col gap-2">
      <label
        for="boardTheme"
        class="text-xs font-bold uppercase tracking-widest text-gray-400"
      >
        {m.settings_boardTheme()}
      </label>
      <select
        id="boardTheme"
        name="boardTheme"
        bind:value={board}
        onchange={onBoardChange}
        class="rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
      >
        {#each data.boards as name}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>

    <div class="flex flex-col gap-2">
      <label
        for="pieceTheme"
        class="text-xs font-bold uppercase tracking-widest text-gray-400"
      >
        {m.settings_pieceSet()}
      </label>
      <select
        id="pieceTheme"
        name="pieceTheme"
        bind:value={piece}
        onchange={onPieceChange}
        class="rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
      >
        {#each data.pieces as name}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>

    <div class="flex items-center justify-between gap-4">
      <p class="text-xs text-gray-500">
        {m.settings_current()} <span class="text-primary">{theme.board}</span> /
        <span class="text-secondary">{theme.piece}</span>
      </p>
      <button
        type="submit"
        class="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20"
      >
        {m.settings_save()}
      </button>
    </div>

    {#if form?.success}
      <p class="text-xs uppercase tracking-widest text-primary">
        {m.settings_saved()}
      </p>
    {:else if form?.error}
      <p class="text-xs uppercase tracking-widest text-red-400">
        {form.error}
      </p>
    {/if}
  </form>
</main>
