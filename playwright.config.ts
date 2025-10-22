import { defineConfig } from '@playwright/test';

import { PLAYWRIGHT_USE } from './tests/config/browser';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	},
	testDir: 'e2e',
	use: {
		...PLAYWRIGHT_USE
	}
});
