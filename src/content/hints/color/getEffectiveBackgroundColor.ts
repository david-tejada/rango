function rgbaToRgb(rgba: string, backgroundRgb: string) {
	const [r, g, b, a] = rgba
		.replaceAll(/[^\d.\s,]/g, "")
		.split(",")
		.map((v) => Number.parseFloat(v));

	const [backgroundR, backgroundG, backgroundB] = backgroundRgb
		.replaceAll(/[^\d.\s,]/g, "")
		.split(",")
		.map((v) => Number.parseFloat(v));

	const red = Math.round((1 - a!) * backgroundR! + a! * r!);
	const green = Math.round((1 - a!) * backgroundG! + a! * g!);
	const blue = Math.round((1 - a!) * backgroundB! + a! * b!);

	return `rgb(${red}, ${green}, ${blue})`;
}

function isRgb(color: string) {
	if (color.startsWith("rgba")) {
		return false;
	}

	return true;
}

function getAscendantRgb(element: Element) {
	let current = element.parentElement;

	while (current) {
		const { backgroundColor } = globalThis.getComputedStyle(current);

		if (isRgb(backgroundColor)) {
			return backgroundColor;
		}

		current = current.parentElement;
	}

	return "rgb(255, 255, 255)";
}

export function getEffectiveBackgroundColor(element: Element) {
	let current: Element | null = element;

	while (current) {
		let { backgroundColor } = globalThis.getComputedStyle(current);

		if (!backgroundColor.startsWith("rgb")) {
			backgroundColor = "rgb(255, 255, 255)";
		}

		if (backgroundColor && backgroundColor !== "rgba(0, 0, 0, 0)") {
			if (isRgb(backgroundColor)) {
				return backgroundColor;
			}

			return rgbaToRgb(backgroundColor, getAscendantRgb(current));
		}

		current = current.parentElement;
	}

	return "rgb(255, 255, 255)";
}
