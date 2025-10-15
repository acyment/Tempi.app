type OrientationCleanup = () => void;

type OrientationHandler = (isPortrait: boolean) => void;

/**
 * Registers resize and orientation listeners and returns a cleanup function.
 * The `onResize` callback is invoked on window resize, while `onOrientationChange`
 * receives explicit portrait/landscape updates from matchMedia changes.
 */
export function setupOrientationListeners(
	onResize: () => void,
	onOrientationChange: OrientationHandler
): OrientationCleanup {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const handleResize = () => {
		onResize();
	};

	window.addEventListener('resize', handleResize);

	let mediaQueryList: MediaQueryList | null = null;

	const handleOrientationChange = (event: MediaQueryListEvent) => {
		onOrientationChange(event.matches);
	};

	if (typeof window.matchMedia === 'function') {
		try {
			mediaQueryList = window.matchMedia('(orientation: portrait)');
			onOrientationChange(mediaQueryList.matches);

			if (typeof mediaQueryList.addEventListener === 'function') {
				mediaQueryList.addEventListener('change', handleOrientationChange);
			} else if (typeof mediaQueryList.addListener === 'function') {
				// Older Safari fallback
				mediaQueryList.addListener(handleOrientationChange);
			}
		} catch (error) {
			// Ignore matchMedia errors (e.g. server-side or unsupported environments)
		}
	}

	return () => {
		window.removeEventListener('resize', handleResize);

		if (mediaQueryList) {
			if (typeof mediaQueryList.removeEventListener === 'function') {
				mediaQueryList.removeEventListener('change', handleOrientationChange);
			} else if (typeof mediaQueryList.removeListener === 'function') {
				mediaQueryList.removeListener(handleOrientationChange);
			}
		}
	};
}

/**
 * Registers global keyboard handlers and returns a cleanup function.
 */
export function setupKeyboardShortcuts(handler: (event: KeyboardEvent) => void): OrientationCleanup {
	if (typeof window === 'undefined') {
		return () => {};
	}

	window.addEventListener('keydown', handler);
	document.addEventListener('keydown', handler);

	return () => {
		window.removeEventListener('keydown', handler);
		document.removeEventListener('keydown', handler);
	};
}
