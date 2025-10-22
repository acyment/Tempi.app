import { onMount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';

import { pwaState } from './state';

export const initPWA = () => {
	if (typeof window === 'undefined') return;
	registerSW({ immediate: true });
	pwaState.init();
};

export const usePWA = () => {
	onMount(() => {
		initPWA();
	});
};
