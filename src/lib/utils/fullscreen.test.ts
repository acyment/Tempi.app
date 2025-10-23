
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enterFullscreen, exitFullscreen, isFullscreenActive, isFullscreenSupported } from './fullscreen';

const originalDocument = globalThis.document;

afterEach(() => {
	if (originalDocument) {
		(globalThis as any).document = originalDocument;
	} else {
		delete (globalThis as any).document;
	}
	vi.restoreAllMocks();
});

describe('fullscreen helpers', () => {
	it('detects support and calls requestFullscreen', async () => {
		const documentStub: any = { fullscreenEnabled: true };
		(globalThis as any).document = documentStub;

		const element = { requestFullscreen: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLElement;

		expect(isFullscreenSupported()).toBe(true);
		await enterFullscreen(element);
		expect(element.requestFullscreen).toHaveBeenCalled();
	});

	it('falls back to webkit methods', async () => {
		const documentStub: any = { fullscreenEnabled: false, webkitFullscreenEnabled: true };
		(globalThis as any).document = documentStub;

		const element = { webkitRequestFullscreen: vi.fn().mockResolvedValue(undefined) } as any;

		expect(isFullscreenSupported()).toBe(true);
		await enterFullscreen(element as unknown as HTMLElement);
		expect(element.webkitRequestFullscreen).toHaveBeenCalled();
	});

	it('detects active fullscreen state and exits', async () => {
		const exit = vi.fn().mockResolvedValue(undefined);
		const documentStub: any = {
			fullscreenEnabled: true,
			exitFullscreen: exit,
			fullscreenElement: {}
		};
		(globalThis as any).document = documentStub;

		expect(isFullscreenActive()).toBe(true);
		await exitFullscreen();
		expect(exit).toHaveBeenCalled();
	});
});
