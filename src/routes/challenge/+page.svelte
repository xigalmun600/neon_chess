<script lang="ts">
  import {
    challengeError,
    invitesState,
    sendInvite,
  } from "$lib/state/challenge.svelte";
  import { send } from "$lib/state/ws-conn";
  import { m } from "$lib/paraglide/messages";

  type SearchResult = { id: number; username: string; elo: number };

  let query = $state("");
  let results = $state<SearchResult[]>([]);
  let searchError = $state<string | null>(null);
  let searching = $state(false);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let inflight: AbortController | null = null;

  $effect(() => {
    const q = query.trim();
    if (debounceTimer) clearTimeout(debounceTimer);
    if (inflight) inflight.abort();
    if (!q) {
      results = [];
      searchError = null;
      searching = false;
      return;
    }
    searching = true;
    debounceTimer = setTimeout(async () => {
      const ctrl = new AbortController();
      inflight = ctrl;
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) {
          searchError = `error ${res.status}`;
          results = [];
          return;
        }
        const body = (await res.json()) as { results: SearchResult[] };
        results = body.results;
        searchError = null;
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          searchError = m.challenge_searchFailed();
        }
      } finally {
        if (inflight === ctrl) inflight = null;
        searching = false;
      }
    }, 200);
  });

  function challenge(r: SearchResult) {
    challengeError.message = null;
    sendInvite(r.id, r.username);
  }

  function cancel(inviteId: string) {
    send({ type: "invite_cancel", inviteId });
    invitesState.outgoing = invitesState.outgoing.filter(
      (i) => i.inviteId !== inviteId,
    );
  }

  const outgoingById = $derived.by(() => {
    const m = new Map<number, string>();
    for (const inv of invitesState.outgoing) m.set(inv.toId, inv.inviteId);
    return m;
  });
</script>

<main class="mx-auto w-full max-w-2xl px-6 py-10">
  <h1
    class="mb-2 text-3xl font-bold uppercase tracking-widest text-primary"
    style="text-shadow: 0 0 12px rgba(0, 255, 255, 0.5);"
  >
    {m.challenge_heading()}
  </h1>
  <p class="mb-8 text-sm uppercase tracking-widest text-gray-400">
    {m.challenge_subheading()}
  </p>

  <section
    class="rounded-xl border border-border-muted bg-surface-dark/80 p-6 backdrop-blur-md"
  >
    <input
      type="text"
      bind:value={query}
      placeholder={m.challenge_placeholder()}
      maxlength="50"
      autocomplete="off"
      class="w-full rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/60"
    />

    {#if searchError}
      <p class="mt-2 text-xs uppercase tracking-widest text-red-400">
        {searchError}
      </p>
    {/if}
    {#if challengeError.message}
      <p
        class="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs uppercase tracking-widest text-red-300"
      >
        {challengeError.message}
      </p>
    {/if}

    {#if query.trim()}
      <div class="mt-3">
        {#if searching && results.length === 0}
          <p class="text-xs text-gray-500">{m.challenge_searching()}</p>
        {:else if results.length === 0}
          <p class="text-xs text-gray-500">{m.challenge_noResults()}</p>
        {:else}
          <ul class="flex flex-col gap-2">
            {#each results as r (r.id)}
              {@const pending = outgoingById.get(r.id)}
              <li
                class="flex items-center gap-3 rounded-lg border border-border-muted bg-surface-light/30 px-3 py-2"
              >
                <span class="flex-1 text-sm font-bold text-white"
                  >{r.username}</span
                >
                <span class="text-xs uppercase tracking-widest text-gray-500"
                  >Elo {r.elo}</span
                >
                {#if pending}
                  <button
                    type="button"
                    onclick={() => cancel(pending)}
                    class="rounded-md border border-border-muted bg-surface-light px-2 py-1 text-xs font-bold uppercase tracking-widest text-gray-300 transition hover:border-secondary hover:text-secondary"
                  >
                    {m.challenge_btnCancel()}
                  </button>
                {:else}
                  <button
                    type="button"
                    onclick={() => challenge(r)}
                    class="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20"
                  >
                    {m.challenge_btnChallenge()}
                  </button>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </section>
</main>
