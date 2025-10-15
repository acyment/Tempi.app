import { afterEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';

import {
	timerStore,
	formattedMinutes,
	formattedSeconds
} from './timer';

describe('timer store', () => {
	it('initializes with idle status and default duration', () => {
		const snapshot = get(timerStore);

		expect(snapshot).toEqual({
			status: 'idle',
			durationSeconds: 300,
			remainingSeconds: 300
		});
	});

	it('derives formatted minutes and seconds for the default time', () => {
		expect(get(formattedMinutes)).toBe('5');
		expect(get(formattedSeconds)).toBe('00');
	});

	it('setDuration updates both duration and remaining time while staying idle', () => {
		timerStore.setDuration(420);
		const snapshot = get(timerStore);

		expect(snapshot).toEqual({
			status: 'idle',
			durationSeconds: 420,
			remainingSeconds: 420
		});
	});

	afterEach(() => {
		timerStore.setDuration(300);
	});
});
