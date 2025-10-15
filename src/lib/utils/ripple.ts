import { tick } from 'svelte';
import { writable, type Readable } from 'svelte/store';

export type RippleIcon = 'play' | 'pause' | 'repeat';

export interface RippleDisplayState {
	x: number;
	y: number;
	size: number;
	active: boolean;
	iconVisible: boolean;
	icon: RippleIcon;
}

type HostResolver = () => HTMLElement | null;

const INITIAL_STATE: RippleDisplayState = {
	x: 0,
	y: 0,
	size: 0,
	active: false,
	iconVisible: false,
	icon: 'play'
};

export function createRippleFeedback(hostResolver: HostResolver) {
	const state = writable<RippleDisplayState>(INITIAL_STATE);

	let rippleTimeout: ReturnType<typeof setTimeout> | null = null;
	let iconTimeout: ReturnType<typeof setTimeout> | null = null;

	const start = async (
		event?: PointerEvent | MouseEvent | KeyboardEvent,
		iconOverride?: RippleIcon,
		defaultIcon: RippleIcon = 'play'
	) => {
		const host = hostResolver();
		if (!host) return;

		const rect = host.getBoundingClientRect();
		let x = rect.width / 2;
		let y = rect.height / 2;

		if (event && 'clientX' in event && 'clientY' in event) {
			x = event.clientX - rect.left;
			y = event.clientY - rect.top;
		}

		const size = Math.hypot(rect.width, rect.height);
		const icon = iconOverride ?? defaultIcon;

		if (rippleTimeout) clearTimeout(rippleTimeout);
		if (iconTimeout) clearTimeout(iconTimeout);

		state.set({
			x,
			y,
			size,
			active: false,
			iconVisible: false,
			icon
		});

		await tick();

		state.set({
			x,
			y,
			size,
			active: true,
			iconVisible: true,
			icon
		});

		rippleTimeout = setTimeout(() => {
			state.update((current) => ({ ...current, active: false }));
		}, 450);

		iconTimeout = setTimeout(() => {
			state.update((current) => ({ ...current, iconVisible: false }));
		}, 400);
	};

	const clearTimers = () => {
		if (rippleTimeout) {
			clearTimeout(rippleTimeout);
			rippleTimeout = null;
		}
		if (iconTimeout) {
			clearTimeout(iconTimeout);
			iconTimeout = null;
		}
	};

	return {
		state: state as Readable<RippleDisplayState>,
		start,
		clearTimers
	};
}
