// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';

import { mockOrientation } from '../../../tests/utils/orientation';

import TimerPage from '../+page.svelte';

let restoreOrientation: (() => void) | null = null;

beforeEach(() => {
	restoreOrientation = mockOrientation(false);
});

afterEach(() => {
	restoreOrientation?.();
	restoreOrientation = null;
	cleanup();
	vi.restoreAllMocks();
});

describe('Timer page', () => {
	it('renders default time display and theme classes', () => {
		const { container } = render(TimerPage);

		const minutes = screen.getByTestId('minutes');
		const seconds = screen.getByTestId('seconds');
		const display = container.querySelector('.time-display');
		if (!display) {
			throw new Error('timer display not found');
		}
		const minutesStyle = getComputedStyle(minutes);
		const secondsStyle = getComputedStyle(seconds);
		const displayStyle = getComputedStyle(display);

		expect(minutes.textContent).toBe('5');
		expect(seconds.textContent).toBe('00');

		expect(seconds.classList.contains('seconds-offset-right')).toBe(true);
		expect(display.getAttribute('data-layout')).toBe('landscape');
		expect(displayStyle.display === 'block' || displayStyle.display === 'inline-block').toBe(true);
		expect(displayStyle.textAlign).toBe('center');
		const lineHeightPx = parseFloat(displayStyle.lineHeight);
		const baseFontPx = parseFloat(displayStyle.fontSize);
		const normalizedLineHeight = lineHeightPx / baseFontPx;
		expect(normalizedLineHeight).toBeCloseTo(0.77, 2);
		expect(minutes.childElementCount).toBe(0);
		expect(seconds.childElementCount).toBe(0);

		const root = container.firstElementChild;
		expect(root).not.toBeNull();
		expect(root?.classList.contains('timer-page')).toBe(true);
		expect(root?.classList.contains('theme-red')).toBe(true);

		expect(minutesStyle.fontFamily.toLowerCase()).toContain('b612 mono');
		expect(minutesStyle.fontWeight === '700' || minutesStyle.fontWeight === 'bold').toBe(true);

		const minutesSize = parseFloat(minutesStyle.fontSize);
		const secondsSize = parseFloat(secondsStyle.fontSize);
		expect(minutesSize).toBeGreaterThanOrEqual(secondsSize * 3);

		const minutesBottom = minutes.getBoundingClientRect().bottom;
		const secondsBottom = seconds.getBoundingClientRect().bottom;
		expect(Math.abs(minutesBottom - secondsBottom)).toBeLessThanOrEqual(0.5);

		const minutesAfter = getComputedStyle(minutes, '::after');
		const secondsAfter = getComputedStyle(seconds, '::after');
		expect(minutesAfter.backgroundColor).toBe('rgba(0, 0, 0, 0)');
		expect(secondsAfter.backgroundColor).toBe('rgba(0, 0, 0, 0)');
		expect(secondsStyle.position).toBe('absolute');
	});

	it('stacks minutes above seconds in portrait orientation', () => {
		restoreOrientation?.();
		restoreOrientation = mockOrientation(true);
		const { container } = render(TimerPage);
		const display = container.querySelector('.time-display');
		if (!display) throw new Error('timer display not found');
		const minutes = screen.getByTestId('minutes');
		const seconds = screen.getByTestId('seconds');

		const displayStyle = getComputedStyle(display);
		const minutesStyle = getComputedStyle(minutes);
		const secondsStyle = getComputedStyle(seconds);

		expect(display.getAttribute('data-layout')).toBe('portrait');
		expect(displayStyle.flexDirection).toBe('column');
		expect(displayStyle.alignItems).toBe('center');
		expect(displayStyle.justifyContent).toBe('center');
		expect(minutesStyle.textAlign).toBe('center');
		expect(secondsStyle.textAlign).toBe('center');
		expect(secondsStyle.transform).toBe('none');
	});

	it('keeps digits within viewport bounds in short landscape viewports', () => {
		vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(430);
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(932);
		const { container } = render(TimerPage);
		const display = container.querySelector('.time-display');
		const minutes = screen.getByTestId('minutes');
		const seconds = screen.getByTestId('seconds');
		if (!display) throw new Error('timer display not found');

		const displayRect = display.getBoundingClientRect();
		const minutesRect = minutes.getBoundingClientRect();
		const secondsRect = seconds.getBoundingClientRect();
		const minutesFont = parseFloat(getComputedStyle(minutes).fontSize);
		const secondsFont = parseFloat(getComputedStyle(seconds).fontSize);

		expect(minutesFont).toBeGreaterThanOrEqual(window.innerHeight * 0.82);
		expect(minutesFont).toBeLessThanOrEqual(window.innerHeight * 0.92);
		expect(secondsFont).toBeLessThanOrEqual(window.innerHeight * 0.4);
		expect(secondsFont * 3.1).toBeLessThanOrEqual(minutesFont);
		expect(minutesRect.bottom).toBeLessThanOrEqual(displayRect.bottom);
		expect(secondsRect.bottom).toBeLessThanOrEqual(displayRect.bottom);
		expect(secondsRect.top).toBeGreaterThanOrEqual(displayRect.top);
	});
});
