import Color from "color";
import { debounce } from "lodash";
import { rgbaToRgb } from "../../lib/rgbaToRgb";
import { type Hint } from "../../typings/Hint";
import { getAllSettings, getSetting } from "../settings/settingsManager";
import { getToggles } from "../settings/toggles";
import { createsStackingContext } from "../utils/createsStackingContext";
import { isEditable } from "../utils/domUtils";
import { getEffectiveBackgroundColor } from "../utils/getEffectiveBackgroundColor";
import { getFirstTextNodeDescendant } from "../utils/nodeUtils";
import { refresh } from "../wrappers/refresh";
import {
	clearHintedWrapper,
	getWrapper,
	getWrapperForElement,
	setHintedWrapper,
} from "../wrappers/wrappers";
import { matchesStagedSelector } from "./customSelectorsStaging";
import { getAptContainer, getContextForHint } from "./getContextForHint";
import { getCustomNudge } from "./getCustomNudge";
import { getElementToPositionHint } from "./getElementToPositionHint";
import { popHint, pushHint } from "./hintsCache";
import {
	cacheLayout,
	clearLayoutCache,
	getBoundingClientRect,
	getClientDimensions,
	getFirstCharacterRect,
	getOffsetParent,
	removeFromLayoutCache,
} from "./layoutCache";
import { setStyleProperties } from "./setStyleProperties";

const hintQueue = new Set<HintClass>();

function addToHintQueue(hint: HintClass) {
	hintQueue.add(hint);
	processHintQueue();
}

const processHintQueue = debounce(() => {
	// We need to make a copy of hintQueue in case a new hint is added to the
	// queue in the middle of this callback. If this happens, for example, after
	// the first for loop but before the second one, the hint will be processed
	// and removed from hintQueue but the hint won't be displayed because we
	// didn't compute the context.
	const queue = new Set(hintQueue);
	const toComputeContext = [];

	for (const hint of queue) {
		if (!hint.container) toComputeContext.push(hint.target);
		if (hint.toBeReattached) hint.reattach();
		// After trying to reattach, the hint might be released if there is not an
		// apt container to place it.
		if (!hint.string) queue.delete(hint);
	}

	cacheLayout(toComputeContext);

	for (const hint of queue) {
		// Between adding the hint to the queue and processing the queue the target
		// element could have been removed from the dom
		if (!hint.target.isConnected) {
			queue.delete(hint);
			hintQueue.delete(hint);
			continue;
		}

		if (!hint.container) hint.computeHintContext();
	}

	const toCache = [];

	// The hints might be off but being computed because of alwaysComputeHintables
	// being enabled. In that case we do all the calculations up to this point but
	// we don't attach hints.
	if (!getToggles().computed) return;

	for (const hint of queue) {
		// We need to render the hint but hide it so we can calculate its size for
		// positioning it and so we can have a transition.
		setStyleProperties(hint.inner, { display: "block" });
		if (!hint.shadowHost.isConnected) hint.container.append(hint.shadowHost);
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

	for (const hint of queue) {
		hint.position();
		hint.shadowHost.dataset["hint"] = hint.string;
		hint.isActive = true;

		// This is here for debugging and testing purposes
		if (
			process.env["NODE_ENV"] !== "production" &&
			hint.target instanceof HTMLElement
		) {
			hint.target.dataset["hint"] = hint.string;
		}
	}

	requestAnimationFrame(() => {
		for (const hint of queue) {
			setStyleProperties(hint.inner, { display: "none" });
		}

		for (const hint of queue) {
			// Here we need to delete from the actual hintQueue and not from queue so
			// that the hints aren't processed in the next call to processHintQueue
			// again. We check toBeReattached because after the hint is appended it
			// could be removed by the page. In that case we don't want to remove it
			// from the queue as it needs to be reattached.
			if (!hint.toBeReattached) hintQueue.delete(hint);

			// This is to make sure that we don't make visible a hint that was
			// released and causing layouts to break. Since release could be called
			// before this callback is called
			if (hint.string) {
				setStyleProperties(hint.inner, {
					display: "block",
					opacity: "100%",
					transition: "opacity 0.3s",
				});
			}
		}
	});

	clearLayoutCache();
}, 100);

// eslint-disable-next-line @typescript-eslint/naming-convention
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
		if (current.contains(hintOuter)) break;

		if (createsStackingContext(current)) {
			const currentIndex = Number.parseInt(
				window.getComputedStyle(current).zIndex,
				10
			);
			zIndex = Number.isNaN(currentIndex) ? 0 : currentIndex;
		}

		current = current.parentElement;
	}

	// We increase the z-index to avoid relying on document order because this can
	// be altered with the property `order` (only in Firefox). We increase it by 5
	// to avoid some instances were the z-index is increased slightly after we
	// have already made the calculations. For example in gmail (All mail) when we
	// hover over a row.
	return zIndex + 5;
}

// This mutation observer takes care of reattaching the hints when they are
// deleted by the page
const containerMutationObserver = new MutationObserver((entries) => {
	for (const entry of entries) {
		for (const node of entry.removedNodes) {
			if (node instanceof HTMLDivElement && node.className === "rango-hint") {
				const inner = node.shadowRoot?.querySelector(".inner");

				if (inner?.textContent) {
					const wrapper = getWrapper(inner.textContent);

					// eslint-disable-next-line max-depth
					if (wrapper?.hint?.string) {
						wrapper.hint.toBeReattached = true;
						addToHintQueue(wrapper.hint);
					}
				}
			}
		}
	}
});

// Keeps track of entries that have been triggered at least once by the
// containerResizeObserver
const entriesSeen = new Set();

/**
 * Resize Observer to reposition Hints when the element that contains them
 * changes size
 */
const containerResizeObserver = new ResizeObserver(async (entries) => {
	let shouldRefresh = false;

	for (const entry of entries) {
		// We need to check that this is not the initial ResizeObserver trigger that
		// happens when you first observe an element
		if (entriesSeen.has(entry.target)) {
			shouldRefresh = true;
		} else {
			entriesSeen.add(entry.target);
		}
	}

	if (shouldRefresh) {
		await refresh({ hintsPosition: true });
	}
});

/**
 * Mutation Observer to keep track of changes to the target elements themselves
 * so that we can recompute the context in case the element we used to position
 * the hint is removed or something else changes.
 */
const targetsMutationObserver = new MutationObserver((entries) => {
	// We filter out the entries of adding or removing hints
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
			!(entry.target.className === "rango-hint") &&
			// Avoid recomputing while we attach hint in development
			entry.attributeName !== "data-hint"
		) {
			const wrapper = getWrapperForElement(entry.target);

			if (wrapper?.hint?.container && wrapper.element.isConnected) {
				wrapper.hint.computeHintContext();
				wrapper.hint.position();
			}
		}
	}
});

// We have to revert any changes that the page might do to the hints attributes
const shadowHostMutationObserver = new MutationObserver((entries) => {
	for (const entry of entries) {
		if (entry.attributeName && entry.attributeName !== "data-hint") {
			(entry.target as HTMLDivElement).removeAttribute(entry.attributeName);
		}
	}
});

// =============================================================================
// HINT CLASS
// =============================================================================

export class HintClass implements Hint {
	shadowHost: HTMLDivElement;
	isActive: boolean;
	outer: HTMLDivElement;
	inner: HTMLDivElement;
	container!: HTMLElement | ShadowRoot;
	limitParent!: HTMLElement;
	availableSpaceLeft?: number;
	availableSpaceTop?: number;
	wrapperRelative?: boolean;
	elementToPositionHint!: Element | SVGElement | Text;
	zIndex?: number;
	positioned: boolean;
	toBeReattached: boolean;
	wasReattached: boolean;
	color!: Color;
	backgroundColor!: Color;
	borderColor!: Color;
	borderWidth: number;
	keyEmphasis?: boolean;
	freezeColors?: boolean;
	firstTextNodeDescendant?: Text;
	string?: string;

	constructor(public target: Element) {
		this.isActive = false;

		this.borderWidth = getSetting("hintBorderWidth");

		this.shadowHost = document.createElement("div");
		this.shadowHost.className = "rango-hint";
		setStyleProperties(this.shadowHost, {
			display: "contents",
		});

		shadowHostMutationObserver.observe(this.shadowHost, { attributes: true });
		const shadow = this.shadowHost.attachShadow({ mode: "open" });

		// Don't display the hints when printing.
		const style = document.createElement("style");
		style.textContent = "@media print { .outer { visibility: hidden; } }";
		shadow.append(style);

		this.outer = document.createElement("div");
		this.outer.className = "outer";
		this.outer.setAttribute("aria-hidden", "true");
		// We set the style properties inline because using stylesheets brought some
		// issues related to CSP in Safari.
		setStyleProperties(this.outer, {
			// Setting "position: absolute" with "inset: auto" (equivalent to setting
			//  top, left, bottom and right to auto) ensures that the position of the
			//  wrapper is the same as if position was static and doesn't occupy any
			//  space. This solves some issues of distorted layouts using "position:
			//  relative".
			position: "absolute",
			inset: "auto",
			display: "block",
			contain: "layout size style",
		});

		this.inner = document.createElement("div");
		this.inner.className = "inner";
		setStyleProperties(this.inner, {
			display: "none",
			"user-select": "none",
			position: "absolute",
			"line-height": "1.25",
			"font-family": "monospace",
			padding: "0 0.15em",
			opacity: "0%",
			contain: "layout style",
			"pointer-events": "none",
			"word-break": "keep-all",
			"text-transform": "none",
			"overflow-wrap": "normal",
			"letter-spacing": "normal",
			"text-indent": "0",
		});

		this.outer.append(this.inner);
		shadow.append(this.outer);

		// Hide the hint if it's the currently focused element.
		if (isEditable(this.target)) {
			if (
				document.hasFocus() &&
				this.target === document.activeElement &&
				isEditable(this.target)
			) {
				setStyleProperties(this.outer, { visibility: "hidden" });
			}

			this.target.addEventListener("focus", () => {
				setStyleProperties(this.outer, { visibility: "hidden" });
			});
			this.target.addEventListener("blur", () => {
				setStyleProperties(this.outer, { visibility: "visible" });
			});
		}

		this.positioned = false;
		this.toBeReattached = false;
		this.wasReattached = false;

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

		targetsMutationObserver.observe(this.target, {
			attributes: true,
			childList: true,
			subtree: true,
		});
	}

	computeColors() {
		let backgroundColor;
		let color;

		if (matchesStagedSelector(this.target, false)) {
			backgroundColor = new Color("red");
			setStyleProperties(this.inner, {
				outline: "2px dashed red",
				"outline-offset": "1px",
			});
			color = new Color("white");
			this.borderColor = color;
		} else if (matchesStagedSelector(this.target, true)) {
			backgroundColor = new Color("green");
			setStyleProperties(this.inner, {
				outline: "2px solid green",
				"outline-offset": "1px",
			});
			color = new Color("white");
			this.borderColor = new Color("white");
		} else {
			const customBackgroundColor = getSetting("hintBackgroundColor");
			const customFontColor = getSetting("hintFontColor");
			const backgroundOpacity = getSetting("hintBackgroundOpacity");

			this.firstTextNodeDescendant = getFirstTextNodeDescendant(this.target);

			if (customBackgroundColor) {
				const colorObject = new Color(customBackgroundColor);
				const alpha = colorObject.alpha();
				backgroundColor =
					alpha === 1 ? colorObject.alpha(backgroundOpacity) : colorObject;
			} else {
				backgroundColor = new Color(
					getEffectiveBackgroundColor(this.target)
				).alpha(backgroundOpacity);
			}

			if (customFontColor && customBackgroundColor) {
				color = new Color(customFontColor);
			} else {
				const elementToGetColorFrom =
					this.firstTextNodeDescendant?.parentElement;
				let colorString = window.getComputedStyle(
					elementToGetColorFrom ?? this.target
				).color;
				colorString = colorString.startsWith("rgb")
					? colorString
					: "rgb(0, 0, 0)";
				color = rgbaToRgb(new Color(colorString || "black"), backgroundColor);

				if (!elementToGetColorFrom) {
					if (backgroundColor.isDark() && color.isDark()) {
						color = new Color("white");
					}

					if (backgroundColor.isLight() && color.isLight()) {
						color = new Color("black");
					}
				}
			}

			if (
				backgroundColor.contrast(color) <
					getSetting("hintMinimumContrastRatio") &&
				!customFontColor
			) {
				color = backgroundColor.isLight()
					? new Color("black")
					: new Color("white");
			}

			this.borderWidth = getSetting("hintBorderWidth");
			this.borderColor = new Color(color).alpha(0.3);
		}

		if (this.keyEmphasis) {
			this.borderColor = new Color(this.color).alpha(0.7);
			this.borderWidth += 1;
		}

		this.backgroundColor = backgroundColor;
		this.color = color;
	}

	updateColors() {
		this.computeColors();

		if (!this.freezeColors) {
			setStyleProperties(this.inner, {
				"background-color": this.backgroundColor.string(),
				color: this.color.string(),
				border: `${this.borderWidth}px solid ${this.borderColor.string()}`,
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

		// We need to set the hinted wrapper here and not when the hint is shown in
		// processHintQueue. This way if the hint characters are updated this Hint
		// will be taken into account and its string refreshed even if the hint is
		// still not visible.
		setHintedWrapper(this.string, this.target);

		addToHintQueue(this);

		return string;
	}

	position() {
		// This guards against Hint.position being called before its context has
		// been computed. For example, if it's
		if (!this.container) return;

		// We need to calculate this here the first time the hint is appended
		if (this.wrapperRelative === undefined) {
			const { display } = window.getComputedStyle(
				this.container instanceof HTMLElement
					? this.container
					: this.container.host
			);

			const hintOffsetParent = getOffsetParent(this.outer);

			// If outer is position absolute and the offset parent is outside the user
			// scrollable container the hints for the overflowing elements will show.
			// To avoid that in those cases we need to use position relative.
			const scrollContainer = getWrapperForElement(
				this.target
			)?.userScrollableContainer;

			if (
				hintOffsetParent &&
				scrollContainer &&
				!scrollContainer.contains(hintOffsetParent) &&
				// We can't use position: relative inside display: grid because it distorts
				// layouts. This seems to work fine but I have to see if it breaks somewhere.
				display !== "grid"
			) {
				this.wrapperRelative = true;
				setStyleProperties(this.outer, {
					position: "relative",
					// In case the container itself is inline (what will happen very
					// rarely), this seems to cause the least amount of layout distortion
					display: "inline",
				});
				// When we change the position property of the hint wrapper its position
				// in the page can change, so we need to invalidate the layout cache
				removeFromLayoutCache(this.outer);
			} else {
				this.wrapperRelative = false;
			}
		}

		if (this.zIndex === undefined) {
			this.zIndex = calculateZIndex(this.target, this.shadowHost);
			setStyleProperties(this.outer, { "z-index": `${this.zIndex}` });
		}

		if (!this.elementToPositionHint.isConnected) {
			this.elementToPositionHint = getElementToPositionHint(this.target);
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

		const [customNudgeLeft, customNudgeTop] = getCustomNudge(this.target);

		const x =
			targetX -
			outerX -
			(this.availableSpaceLeft === undefined
				? hintOffsetX
				: Math.min(hintOffsetX, this.availableSpaceLeft - 1)) +
			customNudgeLeft;
		const y =
			targetY -
			outerY -
			(this.availableSpaceTop === undefined
				? hintOffsetY
				: Math.min(hintOffsetY, this.availableSpaceTop - 1)) +
			customNudgeTop;

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

	clearFlash() {
		setStyleProperties(this.inner, {
			"background-color": this.backgroundColor.string(),
			color: this.color.string(),
		});

		this.freezeColors = false;
	}

	release(returnToStack = true, removeElement = true) {
		if (hintQueue.has(this)) hintQueue.delete(this);
		this.isActive = false;

		// Checking this.string is safer than check in this.inner.textContent as the
		// latter could be removed by a page script
		if (!this.string) return;

		clearHintedWrapper(this.string);

		if (removeElement) {
			setStyleProperties(this.inner, {
				display: "none",
			});
		}

		if (returnToStack) pushHint(this.string);
		this.inner.textContent = "";
		this.string = undefined;

		// We need to remove the hint from the dom once it's not needed. This
		// minimizes the possibility of something weird happening. Like in the
		// YouTube search suggestions where the page inserts elements within the
		// hints if they are not removed.
		if (removeElement) {
			this.shadowHost.remove();
		}

		delete this.shadowHost.dataset["hint"];

		if (
			process.env["NODE_ENV"] !== "production" &&
			this.target instanceof HTMLElement
		)
			delete this.target.dataset["hint"];
	}

	hide() {
		setStyleProperties(this.inner, {
			display: "none",
			opacity: "0%",
		});
	}

	show() {
		addToHintQueue(this);
	}

	/**
	 * Reattach a hint that has being removed by the page. First we try
	 * reattaching it to the same container. If it is deleted again we move it up
	 * the tree where it is less likely to be deleted.
	 */
	reattach() {
		this.toBeReattached = false;

		if (!this.wasReattached) {
			this.container.append(this.shadowHost);
			this.wasReattached = true;
			return;
		}

		// It is unlikely that the hint is removed from the body but if that happens
		// we can't keep reattaching it.
		if (this.container === document.body) {
			this.release();
			return;
		}

		const parent = this.container.parentElement;
		if (parent) {
			const newContainer = getAptContainer(parent);
			if (this.limitParent.contains(newContainer)) {
				this.container = newContainer;
				this.container.append(this.shadowHost);
				containerMutationObserver.observe(this.container, {
					childList: true,
				});

				return;
			}
		}

		// The hint couldn't be reattached so we release it.
		this.release();
	}

	applyDefaultStyle() {
		const {
			hintFontFamily,
			hintFontSize,
			hintWeight,
			hintBorderWidth,
			hintBorderRadius,
			hintUppercaseLetters,
		} = getAllSettings();

		this.computeColors();

		const fontWeight =
			hintWeight === "auto"
				? this.backgroundColor.contrast(this.color) < 7 && hintFontSize < 14
					? "bold"
					: "normal"
				: hintWeight;

		setStyleProperties(this.inner, {
			"background-color": this.backgroundColor.string(),
			color: this.color.string(),
			border: `${hintBorderWidth}px solid ${this.borderColor.string()}`,
			"font-family": hintFontFamily,
			"font-size": `${hintFontSize}px`,
			"font-weight": fontWeight,
			"border-radius": `${hintBorderRadius}px`,
			"text-transform": hintUppercaseLetters ? "uppercase" : "none",
			outline: "none",
		});
	}

	keyHighlight() {
		this.keyEmphasis = true;
		this.updateColors();
	}

	clearKeyHighlight() {
		this.keyEmphasis = false;
		this.borderWidth = getSetting("hintBorderWidth");
		this.updateColors();
	}
}
