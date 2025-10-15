<script lang="ts">
import { onMount, onDestroy, afterUpdate } from 'svelte';
	import {
		formattedMinutes,
		formattedSeconds,
		timerStore as timer
	} from '$lib/stores/timer';

const MINUTE_PIXEL_STEP = 60;
const LONG_PRESS_MS = 600;

const updateMinutesHalf = () => {
	if (layout !== 'landscape') {
		minutesHalf = 0;
		return;
	}
	if (minutesEl) {
		minutesHalf = (minutesEl.offsetWidth ?? 0) / 2;
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

	const clearLongPress = () => {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	};

	onMount(() => {
		const applyLayout = () => {
			layout = calculateLayout();
			updateMinutesHalf();
		};

		applyLayout();

		let mq: MediaQueryList | null = null;
		const handleChange = (event: MediaQueryListEvent) => {
			layout = event.matches ? 'portrait' : 'landscape';
			updateMinutesHalf();
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', applyLayout);
		}

		if (typeof window !== 'undefined' && window.matchMedia) {
			try {
				mq = window.matchMedia('(orientation: portrait)');
				layout = mq.matches ? 'portrait' : 'landscape';
				updateMinutesHalf();

				if (typeof mq.addEventListener === 'function') {
					mq.addEventListener('change', handleChange);
				} else if (typeof mq.addListener === 'function') {
					mq.addListener(handleChange);
				}
			} catch (_error) {
				// ignore
			}
		}

		resizeObserver = new ResizeObserver(() => updateMinutesHalf());
		if (minutesEl) resizeObserver.observe(minutesEl);
		if (secondsEl) resizeObserver.observe(secondsEl);

		const handleKeydown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
				return;
			}

			if (event.key === ' ' || event.code === 'Space') {
				event.preventDefault();
				timer.toggle();
			}

			if (event.key.toLowerCase() === 'r') {
				event.preventDefault();
				timer.reset();
			}
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
			document.addEventListener('keydown', handleKeydown);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', applyLayout);
				window.removeEventListener('keydown', handleKeydown);
				document.removeEventListener('keydown', handleKeydown);
			}

			if (mq) {
				if (typeof mq.removeEventListener === 'function') {
					mq.removeEventListener('change', handleChange);
				} else if (typeof mq.removeListener === 'function') {
					mq.removeListener(handleChange);
				}
			}

			resizeObserver?.disconnect();
		};
	});

onDestroy(() => {
	resizeObserver?.disconnect();
});

afterUpdate(() => {
	updateMinutesHalf();
});

	const handleSurfacePointerDown = (event: PointerEvent) => {
		if ($timer.status !== 'running') return;
		clearLongPress();
		longPressTimer = setTimeout(() => {
			timer.reset();
			clearLongPress();
		}, LONG_PRESS_MS);
	};

	const handleSurfacePointerUp = () => {
		clearLongPress();
	};

	const handleSurfacePointerCancel = () => {
		clearLongPress();
	};

	const toggleTimer = () => {
		timer.toggle();
	};

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
		const target = event.currentTarget as HTMLElement;
		if (target.hasPointerCapture?.(event.pointerId)) {
			target.releasePointerCapture(event.pointerId);
		}
		dragStartY = null;
		lastAppliedMinutes = null;
	};

	const cancelMinutesDrag = (event: PointerEvent) => {
		if (dragStartY === null) return;
		const target = event.currentTarget as HTMLElement;
		if (target.hasPointerCapture?.(event.pointerId)) {
			target.releasePointerCapture(event.pointerId);
		}
		dragStartY = null;
		lastAppliedMinutes = null;
	};
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=B612+Mono:wght@700&display=swap"
	/>
</svelte:head>

<div class="timer-page theme-red" class:timer-complete={$timer.status === 'finished'}>
	<main
		class="time-display"
		aria-label="Countdown timer"
		data-state={$timer.status}
		data-layout={layout}
		style={`--minutes-half: ${minutesHalf}px;`}
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
	}

	.timer-page.timer-complete {
		animation: complete-flash 0.6s steps(2, jump-none) infinite;
	}

	.theme-red {
		background-color: #c8102e;
		color: #fff;
	}

	.time-display {
		position: relative;
		display: inline-block;
		text-align: center;
		line-height: 0.77;
		font-weight: 700;
		touch-action: none;
		user-select: none;
	}

	.time-display[data-layout='portrait'] {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(1rem, 6vw, 3rem);
	}

	.time-part {
		display: inline-block;
		font-variant-numeric: tabular-nums;
		touch-action: none;
	}

	.time-display[data-layout='portrait'] .time-part {
		text-align: center;
		width: 100%;
	}

	.minutes {
		font-size: clamp(32rem, 40vw, 16rem);
		position: relative;
	}

	.seconds {
		font-size: clamp(10rem, 10vw, 4rem);
	}

	.seconds-offset-right {
		position: absolute;
		bottom: 0;
		left: calc(50% + var(--minutes-half, 0px) + clamp(1rem, 4vw, 3rem));
	}

	.time-display[data-layout='portrait'] .seconds-offset-right {
		position: static;
		left: auto;
		bottom: auto;
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
