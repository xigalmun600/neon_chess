<script lang="ts">
  import { goto } from "$app/navigation";
  import { invitesState } from "$lib/state/challenge.svelte";
  import { send } from "$lib/state/ws-conn";
  import { m } from "$lib/paraglide/messages";

  async function accept(inviteId: string) {
    send({ type: "invite_accept", inviteId });
    // remove locally; the upcoming `match` will route us
    invitesState.incoming = invitesState.incoming.filter(
      (i) => i.inviteId !== inviteId,
    );
    await goto("/game?mode=human");
  }

  function decline(inviteId: string) {
    send({ type: "invite_decline", inviteId });
    invitesState.incoming = invitesState.incoming.filter(
      (i) => i.inviteId !== inviteId,
    );
  }
</script>

<div class="pointer-events-none fixed right-4 top-20 z-50 flex flex-col gap-2">
  {#each invitesState.incoming as inv (inv.inviteId)}
    <div
      class="pointer-events-auto flex items-center gap-3 rounded-xl border border-primary/40 bg-surface-dark/95 px-4 py-3 shadow-neon-sm backdrop-blur-md"
    >
      <div class="flex-1">
        <p class="text-xs uppercase tracking-widest text-gray-400">
          {m.invite_request()}
        </p>
        <p class="text-sm font-bold text-white">
          <span class="text-primary">{inv.fromUsername}</span> {m.invite_wantsToPlay()}
        </p>
      </div>
      <button
        type="button"
        onclick={() => accept(inv.inviteId)}
        title={m.invite_accept()}
        class="flex size-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary transition hover:bg-primary/20"
      >
        <span class="material-symbols-outlined !text-lg">check</span>
      </button>
      <button
        type="button"
        onclick={() => decline(inv.inviteId)}
        title={m.invite_decline()}
        class="flex size-9 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
      >
        <span class="material-symbols-outlined !text-lg">close</span>
      </button>
    </div>
  {/each}
</div>
