<script lang="ts">
import { onDestroy } from 'svelte';

import { pwaState, type PWAState } from '$lib/pwa/state';

export let state: PWAState = pwaState;

let status = state.store;
const unsubscribe = state.subscribe((value) => {
	status = value;
});

onDestroy(() => {
	unsubscribe();
});

const handleInstall = () => state.acceptInstall();
const handleDismiss = () => state.dismissInstall();
</script>

{#if status.offline}
	<div class="pwa-offline" role="status">You're offline. Tempi will keep running.</div>
{/if}

{#if status.installPromptVisible}
	<div class="pwa-install" role="dialog" aria-live="polite">
		<div class="pwa-install__content">
			<strong>Add Tempi to your home screen?</strong>
			<div class="pwa-install__actions">
				<button type="button" class="btn" on:click={handleInstall}>Install</button>
				<button type="button" class="btn-secondary" on:click={handleDismiss}>Not now</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pwa-offline {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 0.75rem 1rem;
		background: #111827;
		color: #f9fafb;
		text-align: center;
		font-size: 0.95rem;
		z-index: 50;
	}

	.pwa-install {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		background: rgba(17, 17, 17, 0.9);
		color: #ffffff;
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
		max-width: 18rem;
		z-index: 50;
	}

	.pwa-install__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.btn,
	.btn-secondary {
		font: inherit;
		border-radius: 9999px;
		border: none;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}

	.btn {
		background-color: #ffffff;
		color: #111827;
		font-weight: 600;
	}

	.btn-secondary {
		background: transparent;
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.6);
	}
</style>
