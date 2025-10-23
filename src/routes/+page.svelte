<script lang="ts">
import { onMount, onDestroy, afterUpdate } from 'svelte';
import { setupKeyboardShortcuts, setupOrientationListeners } from '$lib/utils/orientation';
import { releasePointerCapture } from '$lib/utils/pointer';
import { createRippleController, type RippleIcon, type RippleDisplayState } from '$lib/utils/ripple';
import { computeTimerFontSizes } from '$lib/utils/typography';
import { enterFullscreen, exitFullscreen, isFullscreenActive, isFullscreenSupported } from '$lib/utils/fullscreen';
	import {
		formattedMinutes,
		formattedSeconds,
		timerStore as timer
	} from '$lib/stores/timer';

const MINUTE_PIXEL_STEP = 60;
const LONG_PRESS_MS = 600;
const TOUCH_DOUBLE_TAP_WINDOW = 350;

const updateMinutesHalf = () => {
	if (layout !== 'landscape') {
		minutesHalf = 0;
		return;
	}
	if (minutesEl) {
		minutesHalf = (minutesEl.offsetWidth ?? 0) / 2;
	}
};

const updateTypography = () => {
	if (typeof window === 'undefined') return;
	const { minutesPx, secondsPx } = computeTimerFontSizes({
		viewportHeight: window.innerHeight || 0,
		viewportWidth: window.innerWidth || 0
	});

	if (Number.isFinite(minutesPx) && minutesPx > 0) {
		minutesFontSize = `${minutesPx}px`;
	}

	if (Number.isFinite(secondsPx) && secondsPx > 0) {
		secondsFontSize = `${secondsPx}px`;
	}
};

let dragStartY: number | null = null;
let dragStartMinutes = 0;
let lastAppliedMinutes: number | null = null;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let layout: 'landscape' | 'portrait' = 'landscape';
let minutesHalf = 0;
let minutesEl: HTMLElement | null = null;
let secondsEl: HTMLElement | null = null;
let resizeObserver: ResizeObserver | null = null;
let displayEl: HTMLElement | null = null;
let pageEl: HTMLElement | null = null;
const rippleController = createRippleController(() => pageEl ?? displayEl);
let rippleState: RippleDisplayState = rippleController.state;
const unsubscribeRipple = rippleController.subscribe((value) => {
	rippleState = value;
});
let cleanupOrientation: (() => void) | null = null;
let cleanupShortcuts: (() => void) | null = null;
let lastTouchTapTime: number | null = null;
let minutesFontSize = '12rem';
let secondsFontSize = '4rem';
let surfacePointerStart: number | null = null;
let longPressConsumed = false;
let canUseFullscreen = false;

$: iconName = $timer.status === 'running' ? 'pause' : $timer.status === 'finished' ? 'repeat' : 'play';

const startRipple = (event?: PointerEvent | MouseEvent | KeyboardEvent, iconOverride?: RippleIcon) => {
	rippleController.start(event, iconOverride, iconName);
};

const clearLongPress = () => {
	if (longPressTimer) {
		clearTimeout(longPressTimer);
		longPressTimer = null;
	}
};

const setPointerCaptureSafe = (target: HTMLElement | null, event: PointerEvent) => {
	if (target?.setPointerCapture) {
		try {
			target.setPointerCapture(event.pointerId);
		} catch (_error) {
			// Some environments (jsdom) do not fully support pointer capture; ignore.
		}
	}
};

const releasePointerCaptureSafe = (target: HTMLElement | null, event: PointerEvent) => {
	if (target?.releasePointerCapture) {
		try {
			target.releasePointerCapture(event.pointerId);
		} catch (_error) {
			// Ignore if capture was never set.
		}
	}
};

const getNextToggleIcon = (): RippleIcon => {
	if ($timer.status === 'running') return 'pause';
	if ($timer.status === 'finished') return 'repeat';
	return 'play';
};

const handleKeydown = (event: KeyboardEvent) => {
	const target = event.target as HTMLElement | null;
	if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
		return;
	}

	if (event.key === ' ' || event.code === 'Space') {
		event.preventDefault();
		startRipple(event, getNextToggleIcon());
		timer.toggle();
	}

	if (event.key.toLowerCase() === 'r') {
		event.preventDefault();
		startRipple(event, 'repeat');
		timer.reset();
	}
};

const calculateLayout = () => {
	if (typeof window === 'undefined') {
		return 'landscape';
	}

	if (window.matchMedia) {
		try {
			return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
		} catch (_error) {
			// noop fall back to dimensions
		}
	}

	return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

onMount(() => {
	const applyLayout = (portrait?: boolean) => {
		if (typeof portrait === 'boolean') {
			layout = portrait ? 'portrait' : 'landscape';
		} else {
			layout = calculateLayout();
		}
		updateMinutesHalf();
		updateTypography();
	};

	applyLayout();
	canUseFullscreen = isFullscreenSupported();

	cleanupOrientation = setupOrientationListeners(
		() => applyLayout(),
		(isPortrait) => applyLayout(isPortrait)
	);

	cleanupShortcuts = setupKeyboardShortcuts(handleKeydown);

	resizeObserver = new ResizeObserver(() => updateMinutesHalf());
	if (minutesEl) resizeObserver.observe(minutesEl);
	if (secondsEl) resizeObserver.observe(secondsEl);

	return () => {
		cleanupOrientation?.();
		cleanupShortcuts?.();
		resizeObserver?.disconnect();
	};
});

onDestroy(() => {
	rippleController.clearTimers();
	unsubscribeRipple();
	if (longPressTimer) clearTimeout(longPressTimer);
	if (canUseFullscreen && isFullscreenActive()) {
		void exitFullscreen();
	}
});

afterUpdate(() => {
	updateMinutesHalf();
	updateTypography();
});

const handleSurfacePointerDown = (event: PointerEvent) => {
	clearLongPress();
	if ($timer.status !== 'running') {
		return;
	}

	if (event.pointerType === 'touch') {
		event.preventDefault();
		setPointerCaptureSafe(event.currentTarget as HTMLElement | null, event);
	}

	longPressConsumed = false;
	surfacePointerStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

	longPressTimer = setTimeout(() => {
		startRipple(undefined, 'repeat');
		timer.reset();
		longPressConsumed = true;
		surfacePointerStart = null;
		clearLongPress();
	}, LONG_PRESS_MS);
};

const handleSurfacePointerUp = (event: PointerEvent) => {
	releasePointerCaptureSafe(event.currentTarget as HTMLElement | null, event);
	const now =
		typeof performance !== 'undefined' && typeof performance.now === 'function'
			? performance.now()
			: Date.now();
	const pressedDuration = surfacePointerStart !== null ? now - surfacePointerStart : 0;
	const shouldReset = !longPressConsumed && pressedDuration >= LONG_PRESS_MS;

	if (shouldReset && $timer.status === 'running') {
		startRipple(event, 'repeat');
		timer.reset();
		clearLongPress();
		lastTouchTapTime = null;
		surfacePointerStart = null;
		longPressConsumed = false;
		return;
	}

	if (event.pointerType === 'touch') {
		if (lastTouchTapTime !== null && now - lastTouchTapTime <= TOUCH_DOUBLE_TAP_WINDOW) {
			lastTouchTapTime = null;
			clearLongPress();
			startRipple(event, getNextToggleIcon());
			timer.toggle();
			longPressConsumed = false;
			return;
		}
		lastTouchTapTime = now;
	}

	clearLongPress();
	surfacePointerStart = null;
	longPressConsumed = false;
};

const handleSurfacePointerCancel = (event: PointerEvent) => {
	releasePointerCaptureSafe(event.currentTarget as HTMLElement | null, event);
	lastTouchTapTime = null;
	const now =
		typeof performance !== 'undefined' && typeof performance.now === 'function'
			? performance.now()
			: Date.now();
	const pressedDuration = surfacePointerStart !== null ? now - surfacePointerStart : 0;
	if (!longPressConsumed && pressedDuration >= LONG_PRESS_MS && $timer.status === 'running') {
		startRipple(event, 'repeat');
		timer.reset();
	}
	clearLongPress();
	surfacePointerStart = null;
	longPressConsumed = false;
};

const toggleTimer = (event?: MouseEvent) => {
	startRipple(event, getNextToggleIcon());
	timer.toggle();
};

$: if (canUseFullscreen && $timer.status === 'running' && !isFullscreenActive()) {
	void enterFullscreen(pageEl ?? displayEl ?? null).catch(() => {});
}

$: if (canUseFullscreen && $timer.status !== 'running' && isFullscreenActive()) {
	void exitFullscreen().catch(() => {});
}

	const handleMinutesPointerDown = (event: PointerEvent) => {
		if ($timer.status === 'running') return;
		event.stopPropagation();
		event.preventDefault();

		dragStartY = event.clientY;
		dragStartMinutes = Math.round($timer.durationSeconds / 60);
		lastAppliedMinutes = dragStartMinutes;

		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
	};

	const handleMinutesPointerMove = (event: PointerEvent) => {
		if (dragStartY === null) return;
		const deltaY = event.clientY - dragStartY;
		const offset = Math.round(-deltaY / MINUTE_PIXEL_STEP);
		const nextMinutes = Math.max(0, dragStartMinutes + offset);

		if (nextMinutes !== lastAppliedMinutes) {
			timer.setMinutes(nextMinutes);
			lastAppliedMinutes = nextMinutes;
			updateMinutesHalf();
		}
	};

	const endMinutesDrag = (event: PointerEvent) => {
		releasePointerCapture(event.currentTarget as HTMLElement | null, event);
		dragStartY = null;
		lastAppliedMinutes = null;
	};

	const cancelMinutesDrag = (event: PointerEvent) => {
		if (dragStartY === null) return;
		releasePointerCapture(event.currentTarget as HTMLElement | null, event);
		dragStartY = null;
		lastAppliedMinutes = null;
	};
</script>

<svelte:head>
	<link rel="preload" href="/fonts/b612-mono-700.woff2" as="font" type="font/woff2" crossorigin />
</svelte:head>

<div
	class="timer-page theme-red"
	class:timer-complete={$timer.status === 'finished'}
	bind:this={pageEl}
>
	<div class="page-ripple-layer" aria-hidden="true">
		<div
			class="ripple-circle"
			class:is-active={rippleState.active}
			style={`--ripple-x: ${rippleState.x}px; --ripple-y: ${rippleState.y}px; --ripple-size: ${rippleState.size}px;`}
		></div>
	</div>
	<main
		class="time-display"
		aria-label="Countdown timer"
		data-state={$timer.status}
		data-layout={layout}
		bind:this={displayEl}
		style={`--minutes-half: ${minutesHalf}px; --minutes-font-size: ${minutesFontSize}; --seconds-font-size: ${secondsFontSize};`}
		on:dblclick={toggleTimer}
		on:pointerdown={handleSurfacePointerDown}
		on:pointerup={handleSurfacePointerUp}
		on:pointercancel={handleSurfacePointerCancel}
	>
		<span
			data-testid="minutes"
			class="time-part minutes"
			bind:this={minutesEl}
			on:pointerdown={handleMinutesPointerDown}
			on:pointermove={handleMinutesPointerMove}
			on:pointerup={endMinutesDrag}
			on:pointercancel={cancelMinutesDrag}
		>
			{$formattedMinutes}
		</span>
		<span
			data-testid="seconds"
			class="time-part seconds seconds-offset-right"
			aria-label="Seconds"
			bind:this={secondsEl}
		>
			{$formattedSeconds}
		</span>
		<div class="state-icon" aria-hidden="true" class:visible={rippleState.iconVisible}>
			{#if rippleState.icon === 'pause'}
				<svg viewBox="0 0 24 24" role="presentation">
					<path d="M7 5h3v14H7zm7 0h3v14h-3z" />
				</svg>
			{:else if rippleState.icon === 'repeat'}
				<svg viewBox="0 0 24 24" role="presentation">
					<path d="M17 2l4 4-4 4V7H8a4 4 0 0 0-4 4v2H2v-2a6 6 0 0 1 6-6h9V2zm-2 15H6v-3l-4 4 4 4v-3h9a4 4 0 0 0 4-4v-2h2v2a6 6 0 0 1-6 6z" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" role="presentation">
					<path d="M8 5v14l11-7z" />
				</svg>
			{/if}
		</div>
	</main>
</div>

<style>
	.timer-page {
		min-height: 100vh;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'B612 Mono', monospace;
		position: relative;
		overflow: hidden;
	}

	.timer-page.timer-complete {
		animation: complete-flash 0.6s steps(2, jump-none) infinite;
	}

	.theme-red {
		background-color: #c8102e;
		color: #fff;
	}

	.page-ripple-layer {
		pointer-events: none;
		position: absolute;
		inset: 0;
		overflow: hidden;
		z-index: 0;
	}

	.time-display {
		position: relative;
		display: inline-block;
		text-align: center;
		line-height: 0.77;
		font-weight: 700;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		z-index: 1;
	}

	.time-display[data-layout='portrait'] {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(1rem, 6vw, 3rem);
	}

	.time-part {
		position: relative;
		display: inline-block;
		font-variant-numeric: tabular-nums;
		touch-action: none;
		z-index: 1;
	}

	.time-display[data-layout='portrait'] .time-part {
		text-align: center;
		width: 100%;
	}

	.minutes {
		font-size: var(--minutes-font-size, clamp(12rem, 40vw, 32rem));
		position: relative;
	}

	.seconds {
		font-size: var(--seconds-font-size, clamp(4rem, 12vw, 12rem));
	}

	.seconds-offset-right {
		position: absolute;
		bottom: 0;
		left: calc(50% + var(--minutes-half, 0px) + clamp(1rem, 4vw, 3rem));
		z-index: 1;
	}

	.time-display[data-layout='portrait'] .seconds-offset-right {
		position: static;
		left: auto;
		bottom: auto;
	}

	.page-ripple-layer .ripple-circle {
		position: absolute;
		left: calc(var(--ripple-x, 0px) - var(--ripple-size, 0px));
		top: calc(var(--ripple-y, 0px) - var(--ripple-size, 0px));
		width: calc(var(--ripple-size, 0px) * 2);
		height: calc(var(--ripple-size, 0px) * 2);
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0));
		opacity: 0;
		transform: scale(0);
	}

	.page-ripple-layer .ripple-circle.is-active {
		animation: ripple-expand 450ms ease-out forwards;
	}

	@keyframes ripple-expand {
		0% {
			opacity: 0.85;
			transform: scale(0.15);
		}

		100% {
			opacity: 0;
			transform: scale(1.6);
		}
	}

	.state-icon {
		pointer-events: none;
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 150ms ease;
		z-index: 2;
	}

	.state-icon.visible {
		opacity: 0.85;
	}

	.state-icon svg {
		width: clamp(2.5rem, 12vw, 4.5rem);
		height: clamp(2.5rem, 12vw, 4.5rem);
		fill: currentColor;
	}


	@keyframes complete-flash {
		0% {
			background-color: #c8102e;
			color: #ffffff;
		}

		50% {
			background-color: #ffffff;
			color: #c8102e;
		}

		100% {
			background-color: #c8102e;
			color: #ffffff;
		}
	}

	.timer-page.timer-complete .time-display {
		color: inherit;
	}

	@media (prefers-reduced-motion: reduce) {
		.timer-page.timer-complete {
			animation: none;
			background-color: #ffffff;
			color: #c8102e;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.timer-complete {
			animation: none;
			background-color: #ffffff;
			color: #c8102e;
		}
	}
</style>
