// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import TimerPage from '../+page.svelte';
import { timerStore } from '$lib/stores/timer';
import { mockOrientation } from '../../../tests/utils/orientation';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.useRealTimers();
	timerStore.setDuration(300);
	timerStore.reset();
});

describe('Timer completion & shortcuts', () => {
	it('flashes timer surface when countdown reaches zero', async () => {
		const restoreOrientation = mockOrientation(false);
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		try {
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
		} finally {
			restoreOrientation();
		}
	});

	it('responds to keyboard shortcuts: Space toggles, R resets', async () => {
		const restoreOrientation = mockOrientation(false);
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		try {
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
		} finally {
			restoreOrientation();
		}
	});
});
