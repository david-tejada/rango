const labelsInFrame = new Set<string>();

export function addLabelsInFrame(labels: string[]) {
	for (const label of labels) {
		labelsInFrame.add(label);
	}
}

export function deleteLabelsInFrame(labels: string[]) {
	for (const label of labels) {
		labelsInFrame.delete(label);
	}
}

export function clearLabelsInFrame() {
	labelsInFrame.clear();
}

export function getLabelsInFrame() {
	return [...labelsInFrame];
}
