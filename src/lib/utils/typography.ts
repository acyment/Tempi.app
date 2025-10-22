const MIN_MINUTES_PX = 220;
const MIN_SECONDS_PX = 72;
const SECONDS_RATIO_CAP = 3.2;

export interface ViewportDimensions {
	viewportHeight: number;
	viewportWidth: number;
}

export const computeTimerFontSizes = ({
	viewportHeight,
	viewportWidth
}: ViewportDimensions) => {
	const height = Math.max(0, viewportHeight);
	const width = Math.max(0, viewportWidth);

	const minutesUpper = Math.min(height * 0.92, width * 0.68);
	const minutesLower = Math.max(height * 0.88, width * 0.45, MIN_MINUTES_PX);
	const minutesTarget = Math.min(Math.max(minutesLower, MIN_MINUTES_PX), minutesUpper);

	const secondsUpper = Math.min(height * 0.42, width * 0.28);
	const secondsLower = Math.max(height * 0.32, width * 0.12, MIN_SECONDS_PX);
	const secondsCandidate = Math.min(Math.max(secondsLower, MIN_SECONDS_PX), secondsUpper);

	const secondsLimit = minutesTarget / SECONDS_RATIO_CAP;
	const secondsTarget = Math.min(secondsCandidate, secondsLimit);

	return {
		minutesPx: minutesTarget,
		secondsPx: secondsTarget
	};
};
