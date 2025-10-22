import { describe, expect, it } from 'vitest';

import { computeTimerFontSizes } from './typography';

describe('computeTimerFontSizes', () => {
	it('scales fonts appropriately for tall portrait viewports', () => {
		const { minutesPx, secondsPx } = computeTimerFontSizes({
			viewportHeight: 896,
			viewportWidth: 414
		});

		expect(minutesPx).toBeCloseTo(281.52, 2);
		expect(secondsPx).toBeGreaterThanOrEqual(72);
		expect(secondsPx * 3.2).toBeLessThanOrEqual(minutesPx + 0.001);
	});

	it('keeps seconds smaller while maximizing minutes in short landscape viewports', () => {
		const { minutesPx, secondsPx } = computeTimerFontSizes({
			viewportHeight: 430,
			viewportWidth: 932
		});

		expect(minutesPx).toBeCloseTo(395.6, 1);
		expect(secondsPx).toBeLessThanOrEqual(0.4 * 430);
		expect(secondsPx * 3.1).toBeLessThanOrEqual(minutesPx + 0.001);
	});
});
