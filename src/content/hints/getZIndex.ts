export function getZIndex(element: HTMLElement): number {
	let zIndex = Number.NaN;
	let checking = element.offsetParent;

	while (checking && checking instanceof HTMLElement && Number.isNaN(zIndex)) {
		zIndex = Number.parseInt(window.getComputedStyle(checking).zIndex, 10);
		checking = checking.offsetParent;
	}

	return zIndex && !Number.isNaN(zIndex) ? zIndex : 0;
}
