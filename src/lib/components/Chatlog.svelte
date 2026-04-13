<script lang="ts">
  import { chatlog } from "$lib/stores/socket";
</script>

<h1> Chatlog </h1>
<ul>
  {#each $chatlog as message }
    <li>{message}</li>
  {/each}
</ul>

