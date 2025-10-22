// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import TimerPage from '../+page.svelte';
import { timerStore } from '$lib/stores/timer';

const dragPointer = async (target: Element, deltaY: number) => {
	const pointerId = 1;
	fireEvent.pointerDown(target, { pointerId, pointerType: 'touch', clientY: 200 });
	fireEvent.pointerMove(target, {
		pointerId,
		pointerType: 'touch',
		clientY: 200 + deltaY
	});
	fireEvent.pointerUp(target, { pointerId, pointerType: 'touch' });
};

describe('Timer gestures slice 1', () => {
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		timerStore.setDuration(300);
		timerStore.reset();
	});

	it('adjusts minutes with vertical drag on minutes display', async () => {
		render(TimerPage);
		const minutes = screen.getByTestId('minutes');
		const seconds = screen.getByTestId('seconds');

		await dragPointer(minutes, -120); // drag up increases minutes
		expect(minutes.textContent).toBe('7');
		expect(seconds.textContent).toBe('00');

		await dragPointer(minutes, 240); // drag down decreases minutes
		expect(minutes.textContent).toBe('3');
		expect(seconds.textContent).toBe('00');
	});

	it('double-tap anywhere toggles running state and countdown', async () => {
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(TimerPage);
	const surface = screen.getByRole('main', { name: /countdown timer/i });
		const minutes = screen.getByTestId('minutes');
		const seconds = screen.getByTestId('seconds');

		await user.dblClick(surface);
		expect(surface.getAttribute('data-state')).toBe('running');

		await vi.advanceTimersByTimeAsync(1000);
		expect(minutes.textContent).toBe('4');
		expect(seconds.textContent).toBe('59');

		await user.dblClick(surface);
		expect(surface.getAttribute('data-state')).toBe('paused');

		await vi.advanceTimersByTimeAsync(2000);
		expect(minutes.textContent).toBe('4');
		expect(seconds.textContent).toBe('59');
	});

	it('treats two quick touch taps as a toggle gesture', async () => {
		vi.useFakeTimers();
		render(TimerPage);
		const surface = screen.getByRole('main', { name: /countdown timer/i });

		fireEvent.pointerDown(surface, {
			pointerId: 11,
			pointerType: 'touch'
		});
		fireEvent.pointerUp(surface, {
			pointerId: 11,
			pointerType: 'touch'
		});

		await vi.advanceTimersByTimeAsync(0);

		fireEvent.pointerDown(surface, {
			pointerId: 12,
			pointerType: 'touch'
		});
		fireEvent.pointerUp(surface, {
			pointerId: 12,
			pointerType: 'touch'
		});

		await vi.advanceTimersByTimeAsync(0);

		expect(surface.getAttribute('data-state')).toBe('running');
	});

	it('long press resets to default time and stops timer', async () => {
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(TimerPage);
	const surface = screen.getByRole('main', { name: /countdown timer/i });
		const minutes = screen.getByTestId('minutes');
		const seconds = screen.getByTestId('seconds');

		await user.dblClick(surface); // start
		expect(surface.getAttribute('data-state')).toBe('running');

		fireEvent.pointerDown(surface, {
			pointerId: 2,
			pointerType: 'touch'
		});
		await vi.advanceTimersByTimeAsync(750);
		fireEvent.pointerUp(surface, {
			pointerId: 2,
			pointerType: 'touch'
		});

		expect(surface.getAttribute('data-state')).toBe('idle');
		expect(minutes.textContent).toBe('5');
		expect(seconds.textContent).toBe('00');
	});

});
