// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

describe('PWA manifest wiring', () => {
	it('references the web manifest and theme color in app.html', () => {
		const html = readFileSync('src/app.html', 'utf8');
		const dom = new JSDOM(html);
		const { document } = dom.window;

	const manifestLink = document.querySelector('link[rel="manifest"]');
	expect(manifestLink).not.toBeNull();
	expect(manifestLink?.getAttribute('href')).toBe('/manifest.webmanifest');

	const themeMeta = document.querySelector('meta[name="theme-color"]');
	expect(themeMeta).not.toBeNull();
	expect(themeMeta?.getAttribute('content')).toBe('#c8102e');

	const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
	expect(appleIcon).not.toBeNull();
	expect(appleIcon?.getAttribute('href')).toBe('/icons/apple-touch-icon-180.png');

	const webAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
	expect(webAppCapable?.getAttribute('content')).toBe('yes');

	const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis"]');
	expect(fontLinks.length).toBe(0);
	});
});
