export const scrollContainers: Map<EventTarget, boolean> = new Map();

export function containerIsScrolling(container: EventTarget): boolean {
	if (container === document.documentElement || container === document.body) {
		return scrollContainers.get(document) ?? false;
	}

	return scrollContainers.get(container) ?? false;
}
