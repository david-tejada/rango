/* eslint-disable unicorn/prefer-node-protocol */
import fs from "fs";
import path from "path";
import Color from "color";
import { rgbaToRgb } from "../../lib/rgbaToRgb";
import { getHintOption } from "../options/cacheHintOptions";
import { getEffectiveBackgroundColor } from "../utils/getEffectiveBackgroundColor";
import {
	getFirstCharacterRect,
	getFirstTextNodeDescendant,
} from "../utils/nodeUtils";
import { createsStackingContext } from "../utils/createsStackingContext";
import { HintableMark } from "../../typings/ElementWrapper";
import { getElementToPositionHint } from "./getElementToPositionHint";
import { getContextForHint } from "./getContextForHint";
import { popHint, pushHint } from "./hintsCache";
import { setStyleProperties } from "./setStyleProperties";

function calculateZIndex(target: Element, hintOuter: HTMLDivElement) {
	const descendants = target.querySelectorAll("*");
	let zIndex = 1;

	for (const descendant of descendants) {
		if (createsStackingContext(descendant)) {
			const descendantIndex = Number.parseInt(
				window.getComputedStyle(descendant).zIndex,
				10
			);
			if (!Number.isNaN(descendantIndex)) {
				zIndex = Math.max(zIndex, descendantIndex);
			}
		}
	}

	let current: Element | null = target;

	while (current) {
		if (current.contains(hintOuter)) return zIndex;

		if (createsStackingContext(current)) {
			const currentIndex = Number.parseInt(
				window.getComputedStyle(current).zIndex,
				10
			);
			zIndex = Number.isNaN(currentIndex) ? 1 : currentIndex + 1;
		}

		current = current.parentElement;
	}

	return zIndex;
}

/** Sometimes the hint is cut off because a neighboring element has a superior
 * stacking context. If that's the case this takes care to move the hint to
 * within its element so it doesn't get obscured */
// const intersectionObserver = new IntersectionObserver(
// 	(entries, observer) => {
// 		for (const entry of entries) {
// 			if (entry.intersectionRatio < 1) {
// 				continue;
// 			}

// 			const { top, bottom, left, right } = entry.target.getBoundingClientRect();
// 			let visibleCorners = 0;

// 			if (document.elementFromPoint(left + 2, top + 2) === entry.target) {
// 				visibleCorners++;
// 			}

// 			if (document.elementFromPoint(right - 2, top + 2) === entry.target) {
// 				visibleCorners++;
// 			}

// 			if (document.elementFromPoint(right - 2, bottom - 2) === entry.target) {
// 				visibleCorners++;
// 			}

// 			if (document.elementFromPoint(left + 2, bottom - 2) === entry.target) {
// 				visibleCorners++;
// 			}

// 			if (visibleCorners > 0 && visibleCorners < 4) {
// 				(entry.target as HTMLDivElement).dataset.placeWithin = "true";
// 			}

// 			observer.unobserve(entry.target);
// 		}
// 	},
// 	{
// 		root: null,
// 		rootMargin: "0px",
// 		threshold: 1,
// 	}
// );

// eslint-disable-next-line unicorn/prefer-module
const css = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");

function injectShadowStyles(rootNode: ShadowRoot) {
	let stylesPresent = false;

	// This is more performant than using querySelector, especially if there are
	// multiple shadowRoots
	for (const child of rootNode.children) {
		if (child.className === "rango-styles") stylesPresent = true;
	}

	if (!stylesPresent) {
		const style = document.createElement("style");
		style.className = "rango-styles";
		style.textContent = css;

		rootNode.append(style);
	}
}

export class Hint implements HintableMark {
	readonly target: Element;
	readonly outer: HTMLDivElement;
	readonly inner: HTMLDivElement;
	container: HTMLElement | ShadowRoot;
	limitParent: HTMLElement;
	availableSpaceLeft?: number;
	availableSpaceTop?: number;
	wrapperRelative?: boolean;
	elementToPositionHint: Element | SVGElement | Text;
	zIndex?: number;
	positioned: boolean;
	color: Color;
	backgroundColor: Color;
	outlineColor: Color;
	freezeColors?: boolean;
	firstTextNodeDescendant?: Text;
	string?: string;

	constructor(target: Element) {
		this.target = target;
		this.elementToPositionHint = getElementToPositionHint(this.target);
		({
			container: this.container,
			limitParent: this.limitParent,
			availableSpaceLeft: this.availableSpaceLeft,
			availableSpaceTop: this.availableSpaceTop,
		} = getContextForHint(target, this.elementToPositionHint));

		const rootNode = this.container.getRootNode();
		if (rootNode instanceof ShadowRoot) injectShadowStyles(rootNode);

		this.outer = document.createElement("div");
		this.outer.className = "rango-hint-wrapper";

		this.inner = document.createElement("div");
		this.inner.className = "rango-hint";
		this.outer.append(this.inner);

		// intersectionObserver.observe(this.inner);

		this.positioned = false;

		// Initial styles for inner

		this.applyDefaultStyle();
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
		this.outlineColor = new Color(this.color).alpha(0.3);
	}

	updateColors() {
		this.computeColors();
		const subtleHints = getHintOption("hintStyle") === "subtle";

		if (!this.freezeColors) {
			setStyleProperties(this.inner, {
				"background-color": this.backgroundColor.string(),
				color: this.color.string(),
				outline: subtleHints ? "0" : `1px solid ${this.outlineColor.string()}`,
			});
		}
	}

	position() {
		if (!this.elementToPositionHint.isConnected) {
			this.elementToPositionHint = getElementToPositionHint(this.target);
		}

		const { x: targetX, y: targetY } =
			this.elementToPositionHint instanceof Text
				? getFirstCharacterRect(this.elementToPositionHint)
				: this.elementToPositionHint.getBoundingClientRect();
		const { x: outerX, y: outerY } = this.outer.getBoundingClientRect();

		const nudgeX = this.elementToPositionHint instanceof Text ? 0.2 : 0.6;
		const nudgeY = 0.6;

		const hintOffsetX = this.inner.offsetWidth * (1 - nudgeX);
		const hintOffsetY = this.inner.offsetHeight * (1 - nudgeY);

		let x =
			targetX -
			outerX -
			(this.availableSpaceLeft === undefined
				? hintOffsetX
				: Math.min(hintOffsetX, this.availableSpaceLeft - 1));
		let y =
			targetY -
			outerY -
			(this.availableSpaceTop === undefined
				? hintOffsetY
				: Math.min(hintOffsetY, this.availableSpaceTop - 1));

		if (this.inner.dataset["placeWithin"] === "true") {
			x = targetX - outerX + 1;
			y = targetY - outerY + 1;
		}

		setStyleProperties(this.inner, {
			left: `${x}px`,
			top: `${y}px`,
		});

		this.positioned = true;
	}

	flash(ms = 300) {
		setStyleProperties(this.inner, {
			"background-color": this.color.string(),
			color: this.backgroundColor.string(),
		});

		this.freezeColors = true;

		setTimeout(() => {
			this.freezeColors = false;
			this.updateColors();
		}, ms);
	}

	claim() {
		const string = popHint();

		if (!string) throw new Error("No more hint strings available");

		this.inner.textContent = string;
		this.string = string;

		if (!this.outer.isConnected) this.container.append(this.outer);

		// We need to calculate this here the first time the hint is appended
		if (this.wrapperRelative === undefined) {
			const { display } = window.getComputedStyle(
				this.container instanceof HTMLElement
					? this.container
					: this.container.host
			);

			if (
				!this.limitParent.contains(this.outer.offsetParent) &&
				// We can't use position: relative inside display: grid because it distorts
				// layouts. This seems to work fine but I have to see if it breaks somewhere.
				display !== "grid"
			) {
				this.wrapperRelative = true;
				setStyleProperties(this.outer, { position: "relative" });
			} else {
				this.wrapperRelative = false;
			}
		}

		if (this.zIndex === undefined) {
			this.zIndex = calculateZIndex(this.target, this.outer);
			setStyleProperties(this.outer, { "z-index": `${this.zIndex}` });
		}

		// We can't have a transition effect if the element has display: none, thus
		// not rendered. That's why we need nested requestAnimationFrame
		// https://stackoverflow.com/questions/32481972/transition-not-working-when-changing-from-display-none-to-block
		requestAnimationFrame(() => {
			// We need to render the hint but hide it so we can calculate its size for
			// positioning it and so we can have a transition.
			this.inner.classList.add("hidden");

			if (!this.positioned) this.position();

			requestAnimationFrame(() => {
				this.inner.classList.remove("hidden");

				// This is to make sure that we don't make visible a hint that was
				// released and causing layouts to break. Since release could be called
				// before this callback is called
				if (this.string) this.inner.classList.add("visible");
			});
		});

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
		// Checking this.string is safer than check in this.inner.textContent as the
		// latter could be removed by a page script
		if (!this.string) {
			console.warn("Releasing an empty hint");
			return;
		}

		this.inner.classList.remove("visible");

		pushHint(this.string, keepInCache);
		this.inner.textContent = "";
		this.string = undefined;

		// We need to remove the hint from the dom once it's not needed. This
		// minimizes the possibility of something weird happening. Like in the
		// YouTube search suggestions where the page inserts elements within the
		// hints if they are not removed.
		this.outer.remove();

		if (process.env["NODE_ENV"] !== "production") {
			/* eslint-disable @typescript-eslint/no-dynamic-delete */
			delete this.outer.dataset["hint"];
			delete this.inner.dataset["hint"];
			if (this.target instanceof HTMLElement)
				delete this.target.dataset["hint"];
			/* eslint-enable @typescript-eslint/no-dynamic-delete */
		}
	}

	applyDefaultStyle() {
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

		let fontWeight;
		if (fontWeightOption === "auto") {
			fontWeight =
				this.backgroundColor.contrast(this.color) < 7 && hintFontSize < 14
					? "bold"
					: "normal";
		} else {
			fontWeight = `${fontWeightOption}`;
		}

		setStyleProperties(this.inner, {
			"background-color": subtleBackground
				? "transparent"
				: this.backgroundColor.string(),
			color: this.color.string(),
			outline: subtleHints ? "0" : `1px solid ${this.outlineColor.string()}`,
			"font-size": `${hintFontSize}px`,
			"font-weight": fontWeight,
		});
	}

	emphasize() {
		const outlineColor = new Color(this.color).alpha(0.7).string();
		setStyleProperties(this.inner, {
			outline: `2px solid ${outlineColor}`,
			"font-weight": "bold",
		});
	}
}
