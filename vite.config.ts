import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

import { VITEST_BROWSER_INSTANCES } from './tests/config/browser';

const pwaPlugin = await (async () => {
	try {
		const { SvelteKitPWA } = await import('@vite-pwa/sveltekit');
		return SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: false,
			includeAssets: [
				'icons/icon-192.png',
				'icons/icon-512.png',
				'icons/icon-512-maskable.png',
				'icons/apple-touch-icon-180.png',
				'sounds/complete.mp3',
				'fonts/b612-mono-700.woff2'
			],
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,mp3,woff2}'],
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.destination === 'font',
						handler: 'CacheFirst',
						options: {
							cacheName: 'tempi-fonts',
							expiration: {
								maxEntries: 6,
								maxAgeSeconds: 60 * 60 * 24 * 365
							}
						}
					},
					{
						urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'tempi-static'
						}
					},
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/manifest.webmanifest') || url.pathname.endsWith('.json'),
						handler: 'NetworkFirst',
						options: {
							cacheName: 'tempi-manifest'
						}
					}
				]
			},
			devOptions: {
				enabled: false
			}
		});
	} catch (_error) {
		if (process.env.VITEST !== 'true' && process.env.VITEST !== '1') {
			console.warn('PWA plugin not installed. Run "bun add -D @vite-pwa/sveltekit" to enable service worker support.');
		}
		return null;
	}
})();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), ...(pwaPlugin ? [pwaPlugin] : [])],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [...VITEST_BROWSER_INSTANCES]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**', 'e2e/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'e2e/**']
				}
			}
		]
	}
});
