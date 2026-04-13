<script lang="ts">
  import { onMount } from "svelte";
  import { connect, connected, send } from "$lib/stores/socket";

  let message = $state("");
  onMount(() => connect());
  
  function handleSubmit(e:Event){
    e.preventDefault();
    send(message);
    message = "";
  }
</script>

<form class="m-10" onsubmit={handleSubmit}>
  <p>{ $connected ? "connected" : "disconnected"}</p>
  <input type="text" bind:value={message} class="bg-gray-700 text-white border" />
  <button type="submit" class="bg-gray-700 rounded-[5px] pl-2 pr-2">Send</button>
</form>
