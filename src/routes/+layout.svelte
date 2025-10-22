<script lang="ts">
import { usePWA } from '$lib/pwa/register-sw';
import '../app.css';
import favicon from '$lib/assets/favicon.svg';

let { children } = $props();

usePWA();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
