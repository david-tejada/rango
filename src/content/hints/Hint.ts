import Color from "color";
import { rgbaToRgb } from "../../lib/rgbaToRgb";
import { assertDefined } from "../../typings/TypingUtils";
import { zIndexes } from "../getMaximumzIndex";
import { getHintOption } from "../options/cacheHintOptions";
import { getEffectiveBackgroundColor } from "../utils/getEffectiveBackgroundColor";
import { getFirstTextNodeDescendant } from "../utils/nodeUtils";
import { popHint, pushHint } from "./hintsCache";
import { setStyleProperties } from "./setStyleProperties";

export class Hint {
	hintedElement: HTMLElement;
	hintContainer: HTMLElement;
	wrapperDiv: HTMLDivElement;
	innerDiv: HTMLDivElement;

	constructor(hintedElement: HTMLElement, hintContainer: HTMLElement) {
		this.hintedElement = hintedElement;
		this.hintContainer = hintContainer;

		const wrapperDiv = document.createElement("div");
		this.wrapperDiv = wrapperDiv;
		wrapperDiv.className = "rango-hint-wrapper";

		// If the hint container is "display: grid" we can't use position relative
		// because it would occupy one of the positions of the grid
		const position =
			window.getComputedStyle(this.hintContainer).display === "grid"
				? "absolute"
				: "relative";

		setStyleProperties(wrapperDiv, {
			all: "initial",
			position,
			display: "block",
			width: "0",
			height: "0",
		});

		hintContainer.append(wrapperDiv);

		// We create elements for all the hints even if their element is not
		// intersecting or not visible. This will make it more responsive when the
		// hint needs to be shown.
		this.innerDiv = document.createElement("div");
		this.innerDiv.className = "rango-hint";

		// We hide the hint element and only show it when it receives a hint with claim()
		setStyleProperties(this.innerDiv, {
			all: "initial",
			display: "none",
		});

		wrapperDiv.append(this.innerDiv);
		this.applyInitialStyles();
		this.position();
	}

	claim() {
		if (!this.innerDiv.textContent) {
			const text = popHint();
			if (!text) {
				throw new Error("No more hints to claim");
			}

			this.innerDiv.textContent = text;

			// This is here for debugging and testing purposes
			if (process.env["NODE_ENV"] !== "production") {
				this.wrapperDiv.dataset["hint"] = text;
				this.innerDiv.dataset["hint"] = text;
				this.hintedElement.dataset["hint"] = text;
			}
		}

		setStyleProperties(this.innerDiv, { display: "block" });
	}

	release(keepInCache = false) {
		if (this.innerDiv.textContent) {
			pushHint(this.innerDiv.textContent, keepInCache);
			setStyleProperties(this.innerDiv, { display: "none" });
			this.innerDiv.textContent = null;
		}
	}

	remove(keepInCache = false) {
		this.release(keepInCache);
		this.innerDiv.remove();
	}

	setBackgroundColor(color?: Color): Color {
		const backgroundColor =
			color ?? new Color(getEffectiveBackgroundColor(this.hintedElement));

		setStyleProperties(this.innerDiv, {
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

		// const zIndex = this.stackContainer === document.body ? "1" : "2147483647";

		setStyleProperties(this.element, {
			"z-index": getRequiredZIndex(this.stackContainer),
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
		const hintsContainer = this.innerDiv.parentElement;
		assertDefined(hintsContainer);
		const x =
			this.hintedElement.getBoundingClientRect().x -
			hintsContainer.getBoundingClientRect().x;
		const y =
			this.hintedElement.getBoundingClientRect().y -
			hintsContainer.getBoundingClientRect().y;

		setStyleProperties(this.innerDiv, {
			left: `${x}px`,
			top: `${y}px`,
		});
	}

	flash(ms = 300) {
		const backgroundColor = this.innerDiv.style.backgroundColor;
		const color = this.innerDiv.style.color;

		const defaultStyles = {
			color,
			backgroundColor,
		};

		const flashedStyles = {
			color: backgroundColor,
			backgroundColor: color,
		};

		Object.assign(this.innerDiv.style, flashedStyles);

		setTimeout(() => {
			Object.assign(this.innerDiv.style, defaultStyles);
		}, ms);
	}
}
