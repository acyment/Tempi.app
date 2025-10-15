import { vi } from 'vitest';

type OrientationCleanup = () => void;

const EVENT_HANDLERS = {
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	addListener: vi.fn(),
	removeListener: vi.fn(),
	dispatchEvent: vi.fn().mockReturnValue(false)
};

function buildMediaQueryList(matches: boolean, query: string): MediaQueryList {
	return {
		matches,
		media: query,
		onchange: null,
		...EVENT_HANDLERS
	} as unknown as MediaQueryList;
}

export function mockOrientation(portrait: boolean): OrientationCleanup {
	const queryMatcher = (query: string) => {
		if (query.includes('(orientation: portrait)')) {
			return buildMediaQueryList(portrait, query);
		}

		if (query.includes('(orientation: landscape)')) {
			return buildMediaQueryList(!portrait, query);
		}

		return buildMediaQueryList(false, query);
	};

	if (typeof window.matchMedia === 'function') {
		const spy = vi.spyOn(window, 'matchMedia').mockImplementation(queryMatcher);
		return () => {
			spy.mockRestore();
		};
	}

	const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		writable: true,
		value: vi.fn(queryMatcher)
	});

	return () => {
		if (originalDescriptor) {
			Object.defineProperty(window, 'matchMedia', originalDescriptor);
		} else {
			delete (window as typeof window & Record<string, unknown>).matchMedia;
		}
	};
}
