<script lang="ts">
  import Board from "$lib/components/Board.svelte";
  import { connected, connect, send } from "$lib/stores/socket";
  import { onMount } from "svelte";

  onMount(()=>{
    connect();
  })
  
  const findGame = () => {
    const msg = {"type": "match_request"};
    send(msg);
  };
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
  <p>{$connected ? "connected" : "disconnected"}</p>
  <Board />
  <button class="bg-gray-700 rounded-[10px] ml-2 ml-2 p-2" onclick={findGame}> Find game </button>
</main>
