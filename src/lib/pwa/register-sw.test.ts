import { afterEach, describe, expect, it, vi } from 'vitest';

const registerSpy = vi.fn();
const initSpy = vi.fn();

vi.mock('virtual:pwa-register', () => ({
	registerSW: registerSpy
}));

vi.mock('./state', () => ({
	pwaState: {
		init: initSpy
	}
}));

describe('initPWA', () => {
	afterEach(() => {
		registerSpy.mockClear();
		initSpy.mockClear();
	});

	it('does nothing when window is undefined', async () => {
		const { initPWA } = await import('./register-sw');
		const originalWindow = globalThis.window;
		// @ts-expect-error
		delete globalThis.window;
		initPWA();
		if (originalWindow) {
			globalThis.window = originalWindow;
		}
		expect(registerSpy).not.toHaveBeenCalled();
	});

	it('registers service worker in browser context', async () => {
		const { initPWA } = await import('./register-sw');
		globalThis.window = globalThis.window ?? ({} as Window & typeof globalThis);
		initPWA();
		expect(registerSpy).toHaveBeenCalledWith({ immediate: true });
		expect(initSpy).toHaveBeenCalledTimes(1);
	});
});
