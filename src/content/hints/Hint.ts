import Color from "color";
import { rgbaToRgb } from "../../lib/rgbaToRgb";
import { assertDefined } from "../../typings/TypingUtils";
import { getHintOption } from "../options/cacheHintOptions";
import { getInheritedBackgroundColor } from "../utils/getInheritedBackgroundColor";
import { getFirstTextNodeDescendant } from "../utils/nodeUtils";
import { popHint, pushHint } from "./hintsCache";
import { setStyleProperties } from "./setStyleProperties";

export class Hint {
	hintedElement: Element;
	element: HTMLDivElement;
	id: number;
	stackContainer: Element;

	constructor(hintedElement: Element, stackContainer: Element, id: number) {
		this.hintedElement = hintedElement;
		this.id = id;
		this.stackContainer = stackContainer;

		let container: HTMLDivElement | null = stackContainer.querySelector(
			":scope > .rango-hints-container"
		);

		if (!container) {
			container = document.createElement("div");
			container.className = "rango-hints-container";

			// If the stack container is css grid we can't use position relative because
			// it would occupy one of the positions of the grid
			const position =
				window.getComputedStyle(this.stackContainer).display === "grid"
					? "absolute"
					: "relative";

			setStyleProperties(container, {
				all: "initial",
				position,
				display: "block",
				width: "0",
				height: "0",
			});

			stackContainer.prepend(container);
		}

		// We create the element for the hint. We create elements for all the hints
		// even if their element is not intersecting or not visible. This will make it
		// more responsive when the hint needs to be shown.
		this.element = document.createElement("div");
		this.element.className = "rango-hint";
		this.element.dataset["id"] = String(this.id);

		// We hide the hint element and only show it when it receives a hint with claim()
		setStyleProperties(this.element, {
			all: "initial",
			display: "none",
		});

		container.append(this.element);
		this.applyInitialStyles();
		this.position();
	}

	claim() {
		if (!this.element.textContent) {
			const text = popHint();
			if (!text) {
				throw new Error("No more hints to claim");
			}

			this.element.textContent = text;
		}

		setStyleProperties(this.element, { display: "block" });
	}

	release(keepInCache = false) {
		if (this.element.textContent) {
			pushHint(this.element.textContent, keepInCache);
			setStyleProperties(this.element, { display: "none" });
			this.element.textContent = null;
		}
	}

	remove(keepInCache = false) {
		this.release(keepInCache);
		this.element.remove();
	}

	setBackgroundColor(color?: Color): Color {
		const backgroundColor =
			color ??
			getInheritedBackgroundColor(
				this.hintedElement,
				new Color("rgba(0, 0, 0, 0)")
			);

		setStyleProperties(this.element, {
			"background-color": backgroundColor.string(),
		});

		return backgroundColor;
	}

	applyInitialStyles() {
		// Retrieve options
		const hintFontSize = getHintOption("hintFontSize") as number;
		const fontWeightOption = getHintOption("hintWeight") as
			| "auto"
			| "normal"
			| "bold";
		const subtleHints = getHintOption("hintStyle") === "subtle";
		const subtleBackground =
			subtleHints &&
			window.getComputedStyle(this.hintedElement).display.includes("inline");

		const firstTextNodeDescendant = getFirstTextNodeDescendant(
			this.hintedElement
		);

		// Compute hint colors
		const backgroundColor = this.setBackgroundColor();

		const elementToGetColorFrom = firstTextNodeDescendant?.parentElement;
		const colorString = window.getComputedStyle(
			elementToGetColorFrom ?? this.hintedElement
		).color;
		let color = rgbaToRgb(new Color(colorString || "black"), backgroundColor);

		if (!elementToGetColorFrom) {
			if (backgroundColor.isDark() && color.isDark()) {
				color = new Color("white");
			}

			if (backgroundColor.isLight() && color.isLight()) {
				color = new Color("black");
			}
		}

		// A contrast value of 2.5 might seem low but it is necessary to match the look of some pages.
		// Some pages use low contrast with big text and, in my experience, it's more pleasant to keep
		// the aspect of the page. Having in mind that the text of the hints is not something that
		// the user would need to read continuously it might be acceptable to allow such a low contrast
		if (backgroundColor.contrast(color) < 2.5) {
			color = backgroundColor.isLight()
				? new Color("black")
				: new Color("white");
		}

		const outlineColor = new Color(color).alpha(0.3);

		let fontWeight;
		if (fontWeightOption === "auto") {
			fontWeight =
				backgroundColor.contrast(color) < 7 && hintFontSize < 14
					? "bold"
					: "normal";
		} else {
			fontWeight = `${fontWeightOption}`;
		}

		const zIndex = this.stackContainer === document.body ? "1" : "2147483647";

		setStyleProperties(this.element, {
			"z-index": zIndex,
			position: "absolute",
			"border-radius": "20%",
			"line-height": "1.25",
			"font-family": "monospace",
			"background-color": subtleBackground
				? "transparent"
				: backgroundColor.string(),
			color: color.string(),
			outline: subtleHints ? "0" : `1px solid ${outlineColor.string()}`,
			"font-size": `${hintFontSize}px`,
			"font-weight": fontWeight,
			padding: "0 0.15em",
		});
	}

	position() {
		const hintsContainer = this.element.parentElement;
		assertDefined(hintsContainer);
		const x =
			this.hintedElement.getBoundingClientRect().x -
			hintsContainer.getBoundingClientRect().x;
		const y =
			this.hintedElement.getBoundingClientRect().y -
			hintsContainer.getBoundingClientRect().y;

		setStyleProperties(this.element, {
			left: `${x}px`,
			top: `${y}px`,
		});
	}
}
