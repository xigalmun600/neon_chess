<script lang="ts">
  import { game } from "$lib/state/game.svelte";
  import type { PlayerOpponent } from "$lib/state/player-opponent";

  const MAX_LENGTH = 200;

  let { opponent }: { opponent: PlayerOpponent } = $props();

  let draft = $state("");
  let listEl: HTMLDivElement;

  function send(e: Event) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || text.length > MAX_LENGTH) return;
    game.messages.push({ from: "me", text, at: Date.now() });
    opponent.sendChat(text);
    draft = "";
  }

  $effect(() => {
    void game.messages.length;
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
  });
</script>

<div
  class="flex h-[700px] flex-col rounded-xl border border-border-muted bg-surface-dark/80 p-3 backdrop-blur-md"
>
  <h4
    class="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-gray-400"
  >
    Chat
  </h4>
  <div
    bind:this={listEl}
    class="flex flex-1 flex-col gap-2 overflow-y-auto pr-1"
  >
    {#if game.messages.length === 0}
      <p class="mt-4 text-center text-xs text-gray-500">No messages yet.</p>
    {/if}
    {#each game.messages as msg (msg.at)}
      <div
        class="flex {msg.from === 'me' ? 'justify-end' : 'justify-start'}"
      >
        <div
          class="max-w-[80%] break-words rounded-lg border px-3 py-1.5 text-sm {msg.from ===
          'me'
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-secondary/30 bg-secondary/10 text-secondary'}"
        >
          {msg.text}
        </div>
      </div>
    {/each}
  </div>
  <form onsubmit={send} class="mt-2 flex gap-2">
    <input
      type="text"
      bind:value={draft}
      maxlength={MAX_LENGTH}
      placeholder="Say something…"
      class="flex-1 rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/60"
    />
    <button
      type="submit"
      disabled={!draft.trim()}
      class="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Send
    </button>
  </form>
</div>
