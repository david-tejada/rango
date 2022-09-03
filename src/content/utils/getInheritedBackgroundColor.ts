import Color from "color";
import { isRgb, rgbaToRgb } from "../../lib/rgbaToRgb";

function getAscendantRgb(parent: HTMLElement): Color {
	if (parent === null) {
		return new Color("rgb(255, 255, 255)");
	}

	const parentBackgroundColor = new Color(
		window.getComputedStyle(parent).backgroundColor
	);
	if (isRgb(parentBackgroundColor)) {
		return parentBackgroundColor;
	}

	if (parent.parentElement) {
		return getAscendantRgb(parent.parentElement);
	}

	return new Color("rgb(255, 255, 255)");
}

export function getDefaultBackgroundColor(): Color {
	// Have to add to the document in order to use getComputedStyle
	const div = document.createElement("div");
	document.head.append(div);
	const backgroundColor = window.getComputedStyle(div).backgroundColor;
	div.remove();
	return new Color(backgroundColor || "rgba(0, 0, 0, 0)");
}

export function getInheritedBackgroundColor(
	element: Element,
	defaultBackgroundColor: Color
): Color {
	const backgroundColor = new Color(
		window.getComputedStyle(element).backgroundColor || defaultBackgroundColor
	);

	if (
		backgroundColor.rgb().string() !== defaultBackgroundColor.rgb().string()
	) {
		if (isRgb(backgroundColor)) {
			return backgroundColor;
		}

		if (element.parentElement) {
			return rgbaToRgb(backgroundColor, getAscendantRgb(element.parentElement));
		}
	}

	if (!element.parentElement) return new Color("rgb(255, 255, 255)");

	return getInheritedBackgroundColor(
		element.parentElement,
		defaultBackgroundColor
	);
}
