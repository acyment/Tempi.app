import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPWAState } from './state';

type TestInstallPromptEvent = Event & {
	preventDefault: () => void;
	prompt: () => Promise<void>;
};

describe('PWA state', () => {
beforeEach(() => {
	vi.restoreAllMocks();
	class FakeWindow extends EventTarget {}
	const fakeWindow = new FakeWindow() as unknown as Window & typeof globalThis;
	if (!globalThis.window) {
		Object.defineProperty(globalThis, 'window', {
			value: fakeWindow,
			configurable: true
		});
	}
	Object.defineProperty(globalThis, 'navigator', {
		value: { onLine: true },
		configurable: true
	});
});

	it('records beforeinstallprompt event and exposes install prompt flag', () => {
		const state = createPWAState();
		state.init();
		const event = new Event('beforeinstallprompt') as TestInstallPromptEvent;
		event.preventDefault = vi.fn();
		event.prompt = vi.fn().mockResolvedValue(undefined);

		window.dispatchEvent(event);

		expect(event.preventDefault).toHaveBeenCalledTimes(1);
		expect(state.store.installPromptVisible).toBe(true);

		state.acceptInstall();
		expect(event.prompt).toHaveBeenCalledTimes(1);
		expect(state.store.installPromptVisible).toBe(false);
	});

	it('tracks offline status from window events', () => {
		const state = createPWAState();
		state.init();

		window.dispatchEvent(new Event('offline'));
		expect(state.store.offline).toBe(true);

		window.dispatchEvent(new Event('online'));
		expect(state.store.offline).toBe(false);
	});
});
