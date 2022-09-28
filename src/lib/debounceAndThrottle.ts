// Types based on https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940?permalink_comment_id=4276799#gistcomment-4276799
export function debounce<F extends (...args: any[]) => ReturnType<F>>(
	fn: F,
	ms: number
) {
	let timeout: ReturnType<typeof setTimeout>;

	return (...args: Parameters<F>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn(...args);
		}, ms);
	};
}

export function throttle<F extends (...args: any[]) => ReturnType<F>>(
	fn: F,
	ms: number
) {
	let throttlePause: boolean;

	return (...args: Parameters<F>) => {
		if (throttlePause) return;

		throttlePause = true;

		setTimeout(() => {
			fn(...args);
			throttlePause = false;
		}, ms);
	};
}
