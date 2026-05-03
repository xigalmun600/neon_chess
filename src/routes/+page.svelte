<script lang="ts">
</script>

<main
  class="flex min-h-screen flex-col items-center justify-center gap-12 bg-black px-6"
>
  <h1
    class="text-5xl font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
  >
    NEON CHESS
  </h1>

  <div class="flex flex-col gap-6 sm:flex-row">
    <a
      href="/game?mode=human"
      class="rounded-lg border-2 border-cyan-400 px-10 py-4 text-lg font-semibold uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_25px_rgba(34,211,238,0.9)]"
    >
      Play vs Human
    </a>

    <a
      href="/game?mode=machine"
      class="rounded-lg border-2 border-fuchsia-400 px-10 py-4 text-lg font-semibold uppercase tracking-wider text-fuchsia-300 shadow-[0_0_15px_rgba(232,121,249,0.5)] transition hover:bg-fuchsia-400 hover:text-black hover:shadow-[0_0_25px_rgba(232,121,249,0.9)]"
    >
      Play vs Machine
    </a>
  </div>
</main>
