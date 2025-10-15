import { derived, writable, type Readable } from 'svelte/store';

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

interface TimerState {
	status: TimerStatus;
	durationSeconds: number;
	remainingSeconds: number;
}

const DEFAULT_DURATION_SECONDS = 300;

function formatMinutes(value: number): string {
	return Math.floor(value).toString();
}

function formatSeconds(value: number): string {
	return value.toString().padStart(2, '0');
}

function createTimerStore() {
	const { subscribe, set, update } = writable<TimerState>({
		status: 'idle',
		durationSeconds: DEFAULT_DURATION_SECONDS,
		remainingSeconds: DEFAULT_DURATION_SECONDS
	});

	let initialDurationSeconds = DEFAULT_DURATION_SECONDS;
	let ticker: ReturnType<typeof setInterval> | null = null;

	const clearTicker = () => {
		if (ticker) {
			clearInterval(ticker);
			ticker = null;
		}
	};

	const clampDuration = (seconds: number) => {
		if (!Number.isFinite(seconds)) return DEFAULT_DURATION_SECONDS;
		return Math.max(0, Math.floor(seconds));
	};

	const startTicker = () => {
		if (ticker) return;
		ticker = setInterval(() => {
			update((state) => {
				if (state.status !== 'running') {
					clearTicker();
					return state;
				}

				if (state.remainingSeconds <= 1) {
					clearTicker();
					return {
						...state,
						remainingSeconds: 0,
						status: 'finished'
					};
				}

				return {
					...state,
					remainingSeconds: state.remainingSeconds - 1
				};
			});
		}, 1000);
	};

	const setDuration = (seconds: number) => {
		const sanitized = Math.max(60, clampDuration(seconds));
		initialDurationSeconds = sanitized;
		clearTicker();
		set({
			status: 'idle',
			durationSeconds: sanitized,
			remainingSeconds: sanitized
		});
	};

	const setMinutes = (minutes: number) => {
		const sanitizedMinutes = Math.max(1, Math.round(minutes));
		setDuration(sanitizedMinutes * 60);
	};

	const adjustMinutes = (delta: number) => {
		if (!delta) return;
		update((state) => {
			if (state.status === 'running') {
				return state;
			}

			const currentMinutes = Math.round(state.durationSeconds / 60);
			const nextMinutes = Math.max(1, currentMinutes + delta);
			const nextSeconds = nextMinutes * 60;

			initialDurationSeconds = nextSeconds;
			return {
				status: 'idle',
				durationSeconds: nextSeconds,
				remainingSeconds: nextSeconds
			};
		});
	};

	const start = () => {
		let shouldStartTicker = false;
		update((state) => {
			if (state.status === 'running') {
				return state;
			}

			const remainingSeconds = state.remainingSeconds > 0 ? state.remainingSeconds : state.durationSeconds;
			if (remainingSeconds <= 0) {
				return {
					...state,
					remainingSeconds: state.durationSeconds,
					status: state.durationSeconds > 0 ? 'running' : 'idle'
				};
			}

			shouldStartTicker = true;
			return {
				...state,
				status: 'running',
				remainingSeconds
			};
		});

		if (shouldStartTicker) {
			startTicker();
		}
	};

	const pause = () => {
		let didPause = false;
		update((state) => {
			if (state.status !== 'running') {
				return state;
			}
			didPause = true;
			return {
				...state,
				status: 'paused'
			};
		});

		if (didPause) {
			clearTicker();
		}
	};

	const toggle = () => {
		let action: 'start' | 'pause' | 'reset' | null = null;
		update((state) => {
			if (state.status === 'running') {
				action = 'pause';
				return {
					...state,
					status: 'paused'
				};
			}

			if (state.status === 'finished' || state.remainingSeconds <= 0) {
				action = 'reset';
				return {
					status: 'idle',
					durationSeconds: state.durationSeconds || initialDurationSeconds,
					remainingSeconds: state.durationSeconds || initialDurationSeconds
				};
			}

			const nextRemaining = state.remainingSeconds > 0 ? state.remainingSeconds : state.durationSeconds;
			if (nextRemaining <= 0) {
				action = 'reset';
				return {
					status: 'idle',
					durationSeconds: state.durationSeconds || initialDurationSeconds,
					remainingSeconds: state.durationSeconds || initialDurationSeconds
				};
			}

			action = 'start';
			return {
				...state,
				status: 'running',
				remainingSeconds: nextRemaining
			};
		});

		if (action === 'pause') {
			clearTicker();
		} else if (action === 'start') {
			startTicker();
		} else if (action === 'reset') {
			clearTicker();
		}
	};

	const reset = () => {
		clearTicker();
		set({
			status: 'idle',
			durationSeconds: initialDurationSeconds,
			remainingSeconds: initialDurationSeconds
		});
	};

	return {
		subscribe,
		setDuration,
		setMinutes,
		adjustMinutes,
		start,
		pause,
		toggle,
		reset
	};
}

export const timerStore = createTimerStore();

export type TimerReadable = Readable<TimerState> & {
	setDuration: (seconds: number) => void;
	setMinutes: (minutes: number) => void;
	adjustMinutes: (delta: number) => void;
	start: () => void;
	pause: () => void;
	toggle: () => void;
	reset: () => void;
};

export const formattedMinutes = derived(timerStore as Readable<TimerState>, ($timer) =>
	formatMinutes($timer.remainingSeconds / 60)
);

export const formattedSeconds = derived(timerStore as Readable<TimerState>, ($timer) =>
	formatSeconds($timer.remainingSeconds % 60)
);
