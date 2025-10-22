export const HEADLESS = true;

export const VITEST_BROWSER_INSTANCES = [{ browser: 'chromium', headless: HEADLESS }] as const;

export const PLAYWRIGHT_USE = {
	headless: HEADLESS
} as const;
