export const formatMinutes = (totalSeconds: number): string => {
	return Math.floor(totalSeconds / 60).toString();
};

export const formatSeconds = (totalSeconds: number): string => {
	const seconds = Math.floor(totalSeconds % 60);
	return seconds.toString().padStart(2, '0');
};

export const splitTime = (totalSeconds: number): { minutes: string; seconds: string } => {
	return {
		minutes: formatMinutes(totalSeconds),
		seconds: formatSeconds(totalSeconds)
	};
};
