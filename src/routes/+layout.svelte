<script>
import "../app.css";
import favicon from '$lib/assets/favicon.svg';
import { onMount } from "svelte";
import { connect } from "$lib/stores/socket";

let { children } = $props();
onMount(()=>{
  connect();
})
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

{@render children()}
