<script lang="ts">
  import { game } from "$lib/state/game.svelte";
  import { m } from "$lib/paraglide/messages";

  let {
    onPlayAgain,
    onHome,
  }: { onPlayAgain: () => void; onHome: () => void } = $props();

  const headline = $derived.by(() => {
    if (!game.result) return "";
    const w = game.result.winner;
    if (w === "draw") return m.gameOver_draw();
    if (w === "opponent_left") return m.gameOver_opponentLeft();
    if (w === game.color) return m.gameOver_youWon();
    return m.gameOver_youLost();
  });

  const subtitle = $derived.by(() => {
    if (!game.result) return "";
    switch (game.result.reason) {
      case "checkmate":
        return m.gameOver_byCheckmate();
      case "stalemate":
        return m.gameOver_byStalemate();
      case "threefold":
        return m.gameOver_byThreefold();
      case "insufficient":
        return m.gameOver_byInsufficient();
      case "fifty_move":
        return m.gameOver_byFiftyMove();
      case "resign":
        return m.gameOver_byResign();
      case "agreement":
        return m.gameOver_byAgreement();
      case "disconnect":
        return m.gameOver_byDisconnect();
      default:
        return game.result.reason;
    }
  });

  const headlineColor = $derived.by(() => {
    if (!game.result) return "text-gray-300";
    const w = game.result.winner;
    if (w === "draw") return "text-gray-200";
    if (w === game.color) return "text-primary";
    return "text-secondary";
  });
</script>

<div
  class="absolute inset-0 z-10 grid place-items-center bg-black/60 backdrop-blur-sm"
>
  <div
    class="mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border-muted bg-surface-dark/95 px-6 py-8 text-center shadow-neon-sm backdrop-blur-md"
  >
    <h2 class="text-3xl font-bold {headlineColor}">{headline}</h2>
    <p class="text-sm uppercase tracking-widest text-gray-400">{subtitle}</p>
    <div class="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
      <button
        type="button"
        onclick={onPlayAgain}
        class="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20"
      >
        {m.gameOver_playAgain()}
      </button>
      <button
        type="button"
        onclick={onHome}
        class="rounded-lg border border-border-muted bg-surface-light px-4 py-2 text-center text-sm font-bold uppercase tracking-widest text-gray-300 transition hover:bg-surface-dark"
      >
        {m.gameOver_home()}
      </button>
    </div>
  </div>
</div>
