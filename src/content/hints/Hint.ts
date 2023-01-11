/* eslint-disable unicorn/prefer-node-protocol */
import fs from "fs";
import path from "path";
import Color from "color";
import { rgbaToRgb } from "../../lib/rgbaToRgb";
import { getHintOption } from "../options/cacheHintOptions";
import { getEffectiveBackgroundColor } from "../utils/getEffectiveBackgroundColor";
import { getFirstTextNodeDescendant } from "../utils/nodeUtils";
import { createsStackingContext } from "../utils/createsStackingContext";
import { HintableMark } from "../../typings/ElementWrapper";
import {
	clearHintedWrapper,
	getWrapper,
	getWrapperForElement,
	setHintedWrapper,
} from "../wrappers";
import { debounce } from "../../lib/debounceAndThrottle";
import { updatePositionAll } from "../updateWrappers";
import {
	matchesMarkedForInclusion,
	matchesMarkedForExclusion,
} from "./customHintsEdit";
import { getElementToPositionHint } from "./getElementToPositionHint";
import { getContextForHint } from "./getContextForHint";
import { popHint, pushHint } from "./hintsCache";
import { setStyleProperties } from "./setStyleProperties";
import {
	cacheLayout,
	clearLayoutCache,
	getBoundingClientRect,
	getClientDimensions,
	getFirstCharacterRect,
	getOffsetParent,
} from "./layoutCache";

const hintQueue: Set<Hint> = new Set();

function addToHintQueue(hint: Hint) {
	hintQueue.add(hint);
	processHintQueue();
}

const processHintQueue = debounce(() => {
	window.requestIdleCallback(() => {
		const toComputeContext = [];

		for (const hint of hintQueue) {
			if (!hint.container) toComputeContext.push(hint.target);
		}

		cacheLayout(toComputeContext);

		for (const hint of hintQueue) {
			if (!hint.container) hint.computeHintContext();
		}

		const toCache = [];

		for (const hint of hintQueue) {
			hint.inner.classList.add("hidden");
			if (!hint.outer.isConnected) hint.container.append(hint.outer);
			if (!hint.elementToPositionHint.isConnected) {
				hint.elementToPositionHint = getElementToPositionHint(hint.target);
			}

			toCache.push(
				hint.target,
				hint.elementToPositionHint,
				hint.outer,
				hint.inner
			);
		}

		cacheLayout(toCache);

		for (const hint of hintQueue) {
			hintQueue.delete(hint);
			hint.position();
			hint.display();
			setHintedWrapper(hint.string!, hint.target);

			// This is here for debugging and testing purposes
			if (process.env["NODE_ENV"] !== "production") {
				hint.outer.dataset["hint"] = hint.string;
				hint.inner.dataset["hint"] = hint.string;
				if (hint.target instanceof HTMLElement)
					hint.target.dataset["hint"] = hint.string;
			}
		}

		clearLayoutCache();
	});
}, 100);

function calculateZIndex(target: Element, hintOuter: HTMLDivElement) {
	const descendants = target.querySelectorAll("*");
	let zIndex = 0;

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
			zIndex = Number.isNaN(currentIndex) ? 0 : currentIndex;
		}

		current = current.parentElement;
	}

	return zIndex;
}

// eslint-disable-next-line unicorn/prefer-module
const css = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");

// Inject styles for the page. We have to do it like this instead of including
// the css in the manifest because if the extension is disabled/removed the
// hints would remain but the css would be gone and the layout of the page would
// break massively
const style = document.createElement("style");
style.className = "rango-styles";
style.textContent = css;
document.head?.append(style);

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

// This mutation observer takes care of reattaching the hints when they are
// deleted by the page
const containerMutationObserver = new MutationObserver((entries) => {
	for (const entry of entries) {
		for (const node of entry.removedNodes) {
			if (
				node instanceof HTMLDivElement &&
				node.className === "rango-hint-wrapper" &&
				node.textContent
			) {
				const wrapper = getWrapper(node.textContent);

				if (wrapper?.hint?.string) wrapper.hint.reattach();
			}
		}
	}
});

const containerResizeObserver = new ResizeObserver(() => {
	updatePositionAll();
});

// If there are some changes to the target element itself we need to recompute
// the context in case the element we used to position the hint is removed or
// something else changes
const targetMutationObserver = new MutationObserver((entries) => {
	const filtered = entries.filter(
		(entry) =>
			![...entry.addedNodes, ...entry.removedNodes].some(
				(node) =>
					node instanceof HTMLElement && node.className.includes("rango-hint")
			)
	);

	for (const entry of filtered) {
		if (
			entry.target instanceof Element &&
			!entry.target.className.includes("rango-hint") &&
			// Avoid recomputing while we attach hint in development
			entry.attributeName !== "data-hint"
		) {
			const wrapper = getWrapperForElement(entry.target);

			if (wrapper?.hint?.container) {
				wrapper.hint.computeHintContext();
				wrapper.hint.position();
			}
		}
	}
});

export interface Hint extends HintableMark {}

export class Hint {
	constructor(target: Element) {
		this.target = target;

		this.borderWidth = 1;

		this.outer = document.createElement("div");
		this.outer.className = "rango-hint-wrapper";

		this.inner = document.createElement("div");
		this.inner.className = "rango-hint";
		this.outer.append(this.inner);

		this.positioned = false;
		this.reattachedTimes = 0;

		// Initial styles for inner

		this.applyDefaultStyle();
	}

	setBackgroundColor(color?: string) {
		color ??= getEffectiveBackgroundColor(this.target);

		setStyleProperties(this.inner, {
			"background-color": color,
		});
	}

	computeHintContext() {
		this.elementToPositionHint = getElementToPositionHint(this.target);
		({
			container: this.container,
			limitParent: this.limitParent,
			availableSpaceLeft: this.availableSpaceLeft,
			availableSpaceTop: this.availableSpaceTop,
		} = getContextForHint(this.target, this.elementToPositionHint));

		containerMutationObserver.observe(this.container, { childList: true });

		const containerToObserve =
			this.container instanceof HTMLElement
				? this.container
				: this.container.host;
		containerResizeObserver.observe(containerToObserve);

		targetMutationObserver.observe(this.target, {
			attributes: true,
			childList: true,
			subtree: true,
		});

		const rootNode = this.container.getRootNode();
		// We don't need to worry if the shadow styles have been injected already,
		// injectShadowStyles checks that
		if (rootNode instanceof ShadowRoot) injectShadowStyles(rootNode);
	}

	computeColors() {
		let backgroundColor;
		let color;

		if (matchesMarkedForExclusion(this.target)) {
			backgroundColor = new Color("red");
			color = new Color("white");
			this.borderColor = new Color("white");
		} else if (matchesMarkedForInclusion(this.target)) {
			backgroundColor = new Color("green");
			color = new Color("white");
			this.borderColor = new Color("white");
		} else {
			this.firstTextNodeDescendant = getFirstTextNodeDescendant(this.target);
			backgroundColor = new Color(getEffectiveBackgroundColor(this.target));

			const elementToGetColorFrom = this.firstTextNodeDescendant?.parentElement;
			const colorString = window.getComputedStyle(
				elementToGetColorFrom ?? this.target
			).color;
			color = rgbaToRgb(new Color(colorString || "black"), backgroundColor);

			if (!elementToGetColorFrom) {
				if (backgroundColor.isDark() && color.isDark()) {
					color = new Color("white");
				}

				if (backgroundColor.isLight() && color.isLight()) {
					color = new Color("black");
				}
			}

			if (backgroundColor.contrast(color) < 4) {
				color = backgroundColor.isLight()
					? new Color("black")
					: new Color("white");
			}

			this.borderWidth = 1;
			this.borderColor = new Color(color).alpha(0.3);
		}

		if (this.keyEmphasis) {
			this.borderColor = new Color(this.color).alpha(0.7);
			this.borderWidth = 2;
		}

		this.backgroundColor = backgroundColor;
		this.color = color;
	}

	updateColors() {
		this.computeColors();
		const subtleHints = getHintOption("hintStyle") === "subtle";

		if (!this.freezeColors) {
			setStyleProperties(this.inner, {
				"background-color": this.backgroundColor.string(),
				color: this.color.string(),
				border: subtleHints
					? "0"
					: `${this.borderWidth}px solid ${this.borderColor.string()}`,
			});
		}
	}

	claim() {
		const string = popHint();

		if (!string) {
			console.warn("No more hint strings available");
			return;
		}

		this.inner.textContent = string;
		this.string = string;

		addToHintQueue(this);

		return string;
	}

	position() {
		// We need to calculate this here the first time the hint is appended
		if (this.wrapperRelative === undefined) {
			const { display } = window.getComputedStyle(
				this.container instanceof HTMLElement
					? this.container
					: this.container.host
			);

			const hintOffsetParent = getOffsetParent(this.outer);

			if (
				hintOffsetParent &&
				!this.limitParent.contains(hintOffsetParent) &&
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

		const { x: targetX, y: targetY } =
			this.elementToPositionHint instanceof Text
				? getFirstCharacterRect(this.elementToPositionHint)
				: getBoundingClientRect(this.elementToPositionHint);
		const { x: outerX, y: outerY } = getBoundingClientRect(this.outer);

		let nudgeX = 0.3;
		let nudgeY = 0.5;

		// Since hints could be obscure by a neighboring element with superior
		// z-index, and since the algorithm to detect that would be complicated, a
		// simple solution is to, when possible, place the hint as close to the
		// hinted element as possible
		if (this.elementToPositionHint instanceof Text) {
			const { fontSize } = window.getComputedStyle(
				this.elementToPositionHint.parentElement!
			);
			const fontSizePixels = Number.parseInt(fontSize, 10);
			if (fontSizePixels < 15) {
				nudgeX = 0.3;
				nudgeY = 0.5;
			} else if (fontSizePixels < 20) {
				nudgeX = 0.4;
				nudgeY = 0.6;
			} else {
				nudgeX = 0.6;
				nudgeY = 0.8;
			}
		}

		if (!(this.elementToPositionHint instanceof Text)) {
			const { width, height } = getBoundingClientRect(
				this.elementToPositionHint
			);

			if (
				(width > 30 && height > 30) ||
				// This is to avoid the hint being hidden by a superior stacking context
				// in some pages when a very small textarea element is used to display a
				// blinking cursor (CodePen, for example)
				this.target instanceof HTMLTextAreaElement
			) {
				nudgeX = 1;
				nudgeY = 1;
			}
		}

		const hintOffsetX =
			getClientDimensions(this.inner).offsetWidth! * (1 - nudgeX);
		const hintOffsetY =
			getClientDimensions(this.inner).offsetHeight! * (1 - nudgeY);

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

	display() {
		// We need to render the hint but hide it so we can calculate its size for
		// positioning it and so we can have a transition.

		if (!this.positioned) this.position();

		requestAnimationFrame(() => {
			this.inner.classList.remove("hidden");

			// This is to make sure that we don't make visible a hint that was
			// released and causing layouts to break. Since release could be called
			// before this callback is called
			if (this.string) this.inner.classList.add("visible");
		});
	}

	release(returnToStack = true) {
		if (hintQueue.has(this)) hintQueue.delete(this);

		// Checking this.string is safer than check in this.inner.textContent as the
		// latter could be removed by a page script
		if (!this.string) {
			console.warn("Releasing an empty hint");
			return;
		}

		clearHintedWrapper(this.string);

		this.inner.classList.remove("visible");

		if (returnToStack) pushHint(this.string);
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

	reattach() {
		// We put a limit on how many times we reattach the hint to avoid a vicious
		// cycle in which the page deletes the hint and we reattach it
		// constantly
		if (this.reattachedTimes < 2) {
			this.container.append(this.outer);
			this.reattachedTimes++;
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
			border: subtleHints ? "0" : `1px solid ${this.borderColor.string()}`,
			"font-size": `${hintFontSize}px`,
			"font-weight": fontWeight,
		});
	}

	keyHighlight() {
		this.keyEmphasis = true;
		this.updateColors();
	}

	clearKeyHighlight() {
		this.keyEmphasis = false;
		this.updateColors();
	}
}
