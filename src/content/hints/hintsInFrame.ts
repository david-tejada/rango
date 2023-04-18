const hintsInFrame = new Set<string>();

export function addHintsInFrame(hints: string[]) {
	for (const hint of hints) {
		hintsInFrame.add(hint);
	}
}

export function deleteHintsInFrame(hints: string[]) {
	for (const hint of hints) {
		hintsInFrame.delete(hint);
	}
}

export function clearHintsInFrame() {
	hintsInFrame.clear();
}

export function getHintsInFrame() {
	return [...hintsInFrame];
}
