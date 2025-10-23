const getDocument = () => (typeof document !== 'undefined' ? document : null);

export const isFullscreenSupported = () => {
	const doc = getDocument();
	return !!doc && (!!doc.fullscreenEnabled || !!(doc as any).webkitFullscreenEnabled);
};

export const enterFullscreen = async (element: HTMLElement | null) => {
	if (!element || !isFullscreenSupported()) return;

	const fn =
		element.requestFullscreen ||
		(element as any).webkitRequestFullscreen ||
		(element as any).webkitEnterFullscreen;

	if (typeof fn === 'function') {
		await fn.call(element);
	}
};

export const exitFullscreen = async () => {
	const doc = getDocument();
	if (!doc) return;

	const exitFn =
		doc.exitFullscreen ||
		(doc as any).webkitExitFullscreen ||
		(doc as any).webkitCancelFullScreen;

	if (typeof exitFn === 'function') {
		await exitFn.call(doc);
	}
};

export const isFullscreenActive = () => {
	const doc = getDocument();
	if (!doc) return false;

	return !!(doc.fullscreenElement || (doc as any).webkitFullscreenElement);
};
