import Color from "color";
import { rgbaToRgb } from "../lib/rgbaToRgb";
import { getSuitableHintContainer } from "./hints/getSuitableHintContainer";
import { popHint, pushHint } from "./hints/hintsCache";
import { setStyleProperties } from "./hints/setStyleProperties";
import { getHintOption } from "./options/cacheHintOptions";
import { getEffectiveBackgroundColor } from "./utils/getEffectiveBackgroundColor";
import { getFirstTextNodeDescendant } from "./utils/nodeUtils";

export class Hint {
	readonly target: Element;
	readonly outer: HTMLDivElement;
	readonly inner: HTMLDivElement;
	readonly container: Element;
	positioned: boolean;
	x?: number;
	y?: number;
	color: Color;
	backgroundColor: Color;
	firstTextNodeDescendant?: Text;
	string?: string;

	constructor(target: Element) {
		this.target = target;
		this.container = getSuitableHintContainer(target);

		this.outer = document.createElement("div");
		this.outer.className = "rango-hint-wrapper";

		this.inner = document.createElement("div");
		this.inner.className = "rango-hint";
		this.outer.append(this.inner);

		this.positioned = false;

		// Initial styles for outer
		const position =
			window.getComputedStyle(this.container).display === "grid"
				? "absolute"
				: "relative";

		setStyleProperties(this.outer, {
			all: "initial",
			position,
			width: "0",
			height: "0",
			display: "none",
		});

		// Initial styles for inner

		// Retrieve options
		const hintFontSize = getHintOption("hintFontSize") as number;
		const fontWeightOption = getHintOption("hintWeight") as
			| "auto"
			| "normal"
			| "bold";
		const subtleHints = getHintOption("hintStyle") === "subtle";
		const subtleBackground =
			subtleHints &&
			window.getComputedStyle(this.target).display.includes("inline");

		this.computeColors();

		const outlineColor = new Color(this.color).alpha(0.3);

		let fontWeight;
		if (fontWeightOption === "auto") {
			fontWeight =
				this.backgroundColor.contrast(this.color) < 7 && hintFontSize < 14
					? "bold"
					: "normal";
		} else {
			fontWeight = `${fontWeightOption}`;
		}

		// We do this first as setStyleProperties doesn't guarantee going over the
		// properties in order
		setStyleProperties(this.inner, {
			all: "initial",
		});

		setStyleProperties(this.inner, {
			display: "none",
			"z-index": "7000",
			position: "absolute",
			"border-radius": "20%",
			"line-height": "1.25",
			"font-family": "monospace",
			"background-color": subtleBackground
				? "transparent"
				: this.backgroundColor.string(),
			color: this.color.string(),
			outline: subtleHints ? "0" : `1px solid ${outlineColor.string()}`,
			"font-size": `${hintFontSize}px`,
			"font-weight": fontWeight,
			padding: "0 0.15em",
		});
	}

	setBackgroundColor(color?: string) {
		color ??= getEffectiveBackgroundColor(this.target);

		setStyleProperties(this.inner, {
			"background-color": color,
		});
	}

	computeColors() {
		this.firstTextNodeDescendant = getFirstTextNodeDescendant(this.target);
		const backgroundColor = new Color(getEffectiveBackgroundColor(this.target));

		const elementToGetColorFrom = this.firstTextNodeDescendant?.parentElement;
		const colorString = window.getComputedStyle(
			elementToGetColorFrom ?? this.target
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

		/**
		 * A contrast value of 2.5 might seem low but it is necessary to match the
		 * look of some pages. Some pages use low contrast with big text and, in my
		 * experience, it's more pleasant to keep the aspect of the page. Having in
		 * mind that the text of the hints is not something that the user would need
		 * to read continuously it might be acceptable to allow such a low contrast
		 */
		if (backgroundColor.contrast(color) < 2.5) {
			color = backgroundColor.isLight()
				? new Color("black")
				: new Color("white");
		}

		this.backgroundColor = backgroundColor;
		this.color = color;
	}

	updateColors() {
		this.computeColors();
		setStyleProperties(this.inner, {
			"background-color": this.backgroundColor.string(),
			color: this.color.string(),
		});
	}

	position() {
		if (!this.outer.isConnected) {
			throw new Error("Trying to position an unconnected hint.");
		}

		const { x: targetX, y: targetY } = this.target.getBoundingClientRect();
		const { x: outerX, y: outerY } = this.outer.getBoundingClientRect();
		const x = targetX - outerX;
		const y = targetY - outerY;

		this.x = x;
		this.y = y;

		setStyleProperties(this.inner, {
			left: `${x}px`,
			top: `${y}px`,
		});
	}

	flash(ms = 300) {
		setStyleProperties(this.inner, {
			"background-color": this.color.string(),
			color: this.backgroundColor.string(),
		});

		setTimeout(() => {
			this.computeColors();
		}, ms);
	}

	claim() {
		const string = popHint();

		if (!string) {
			throw new Error("No more hint strings available");
		}

		this.inner.textContent = string;
		this.string = string;
		this.container.append(this.outer);

		setStyleProperties(this.outer, { display: "block" });

		if (!this.positioned) {
			this.position();
			this.positioned = true;
		}

		setStyleProperties(this.inner, { display: "block" });

		// This is here for debugging and testing purposes
		if (process.env["NODE_ENV"] !== "production") {
			this.outer.dataset["hint"] = string;
			this.inner.dataset["hint"] = string;
			if (this.target instanceof HTMLElement)
				this.target.dataset["hint"] = string;
		}

		return string;
	}

	release(keepInCache = false) {
		if (!this.inner.textContent || !this.string) {
			throw new Error("HintError: Trying to release a null hint");
		}

		pushHint(this.string, keepInCache);
		this.outer.remove();
		this.inner.textContent = "";
		this.string = undefined;
		setStyleProperties(this.outer, { display: "none" });
		setStyleProperties(this.inner, { display: "none" });

		if (process.env["NODE_ENV"] !== "production") {
			/* eslint-disable @typescript-eslint/no-dynamic-delete */
			delete this.outer.dataset["hint"];
			delete this.inner.dataset["hint"];
			if (this.target instanceof HTMLElement)
				delete this.target.dataset["hint"];
			/* eslint-enable @typescript-eslint/no-dynamic-delete */
		}
	}
}
