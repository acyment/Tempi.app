// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import TimerPage from '../+page.svelte';
import { timerStore } from '$lib/stores/timer';

const ensureMatchMedia = () => {
	if (!window.matchMedia) {
		Object.defineProperty(window, 'matchMedia', {
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false
			})),
			writable: true
		});
	}
};

const mockOrientation = (portrait: boolean) => {
	ensureMatchMedia();
	vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
		if (query.includes('(orientation: portrait)')) {
			return {
				matches: portrait,
				media: query,
				onchange: null,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false
			} as MediaQueryList;
		}

		if (query.includes('(orientation: landscape)')) {
			return {
				matches: !portrait,
				media: query,
				onchange: null,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false
			} as MediaQueryList;
		}

		return {
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false
		} as MediaQueryList;
	});
};

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.useRealTimers();
	timerStore.setDuration(300);
	timerStore.reset();
});

describe('Timer completion & shortcuts', () => {
	it('flashes timer surface when countdown reaches zero', async () => {
		mockOrientation(false);
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		const { container } = render(TimerPage);
		const page = container.querySelector('.timer-page');
		const surface = container.querySelector('.time-display');
		if (!page || !surface) throw new Error('timer surface missing');
		const [minutes] = screen.getAllByTestId('minutes');
		const [seconds] = screen.getAllByTestId('seconds');

		await user.dblClick(surface);
		await vi.advanceTimersByTimeAsync(300_000);

		expect(surface.getAttribute('data-state')).toBe('finished');
		expect(minutes.textContent).toBe('0');
		expect(seconds.textContent).toBe('00');
		expect(page.classList.contains('timer-complete')).toBe(true);

		await user.dblClick(surface);
		expect(surface.getAttribute('data-state')).toBe('idle');
		expect(minutes.textContent).toBe('5');
		expect(seconds.textContent).toBe('00');
		expect(page.classList.contains('timer-complete')).toBe(false);
	});

	it('responds to keyboard shortcuts: Space toggles, R resets', async () => {
		mockOrientation(false);
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		const { container } = render(TimerPage);
		const surface = container.querySelector('.time-display');
		if (!surface) throw new Error('timer surface missing');
		const [minutes] = screen.getAllByTestId('minutes');
		const [seconds] = screen.getAllByTestId('seconds');

		window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
		await vi.advanceTimersByTimeAsync(0);
		await Promise.resolve();
		expect(surface.getAttribute('data-state')).toBe('running');

		await vi.advanceTimersByTimeAsync(1000);
		expect(minutes.textContent).toBe('4');
		expect(seconds.textContent).toBe('59');

		window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
		await vi.advanceTimersByTimeAsync(0);
		await Promise.resolve();
		expect(surface.getAttribute('data-state')).toBe('paused');

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true }));
		await vi.advanceTimersByTimeAsync(0);
		await Promise.resolve();
		expect(surface.getAttribute('data-state')).toBe('idle');
		expect(minutes.textContent).toBe('5');
		expect(seconds.textContent).toBe('00');
	});
});
