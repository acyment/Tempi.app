export const releasePointerCapture = (target: Element | null, event: PointerEvent) => {
	if (!target || typeof (target as HTMLElement).hasPointerCapture !== 'function') {
		return;
	}

	const element = target as HTMLElement;
	if (element.hasPointerCapture(event.pointerId)) {
		element.releasePointerCapture(event.pointerId);
	}
};
