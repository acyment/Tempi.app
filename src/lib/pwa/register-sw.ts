import { onMount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';

export const initPWA = () => {
	if (typeof window === 'undefined') return;
	registerSW({ immediate: true });
};

export const usePWA = () => {
	onMount(() => {
		initPWA();
	});
};
