// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';

import PWAPrompt from './PWAPrompt.svelte';

const createMockState = (initial = { installPromptVisible: false, offline: false }) => {
	let value = initial;
	const subscribers = new Set<(status: typeof value) => void>();
	const notify = () => subscribers.forEach((fn) => fn(value));

	return {
		store: value,
		subscribe(fn: (val: typeof value) => void) {
			subscribers.add(fn);
			fn(value);
			return () => subscribers.delete(fn);
		},
		acceptInstall: vi.fn(),
		dismissInstall: vi.fn(),
		set(next: Partial<typeof value>) {
			value = { ...value, ...next };
			notify();
		}
	};
};

describe('PWAPrompt component', () => {
	it('shows install controls when prompt is visible', async () => {
		const state = createMockState({ installPromptVisible: true, offline: false });
		render(PWAPrompt, { props: { state } });

		const installButton = await screen.findByRole('button', { name: /install/i });
		fireEvent.click(installButton);

		expect(state.acceptInstall).toHaveBeenCalled();

		const dismissButton = screen.getByRole('button', { name: /not now/i });
		fireEvent.click(dismissButton);
		expect(state.dismissInstall).toHaveBeenCalled();
	});

	it('indicates offline status when offline flag set', async () => {
		const state = createMockState({ installPromptVisible: false, offline: true });
		render(PWAPrompt, { props: { state } });

		expect(screen.getByRole('status')).toHaveTextContent(/offline/i);

		state.set({ offline: false });
		await waitFor(() => {
			expect(screen.queryByRole('status')).toBeNull();
		});
	});
});
