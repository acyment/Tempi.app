import { describe, expect, it } from 'vitest';

import { formatMinutes, formatSeconds } from './time';

describe('time formatting helpers', () => {
	it('pads and floors minutes correctly', () => {
		expect(formatMinutes(300)).toBe('5');
		expect(formatMinutes(89)).toBe('1');
		expect(formatMinutes(0)).toBe('0');
	});

	it('pads seconds to two digits', () => {
		expect(formatSeconds(0)).toBe('00');
		expect(formatSeconds(5)).toBe('05');
		expect(formatSeconds(59)).toBe('59');
	});
});
