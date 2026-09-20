import type Color from "colorjs.io";
import { debounce } from "lodash";
import { isFlippedWithScaleY } from "../dom/isFlippedWithScaleY";
import { setStyleProperties } from "../dom/setStyleProperties";
import { isEditable } from "../dom/utils";
import { settingsSync } from "../settings/settingsSync";
import { getToggles } from "../settings/toggles";
import { refresh } from "../wrappers/refresh";
import { rehintPending } from "../wrappers/rehint";
import {
	clearHintedWrapper,
	getWrapper,
	getWrapperForElement,
	setHintedWrapper,
} from "../wrappers/wrappers";
import { green, red } from "./color/colors";
import {
	getHintBackgroundColor,
	getHintForegroundColor,
} from "./color/hintColors";
import { resolveBackgroundColor } from "./color/resolveBackgroundColor";
import { matchesStagedSelector } from "./customHints/customSelectorsStaging";
import { type LabelAssignment, popLabel, pushLabel } from "./labels/labelCache";
import {
	cacheLayout,
	clearLayoutCache,
	getBoundingClientRect,
	getClientDimensions,
	getFirstCharacterRect,
	getOffsetParent,
	removeFromLayoutCache,
} from "./layoutCache";
import { createsStackingContext } from "./positioning/createsStackingContext";
import {
	getAptContainer,
	getContextForHint,
} from "./positioning/getContextForHint";
import { getCustomNudge } from "./positioning/getCustomNudge";
import { getElementToPositionHint } from "./positioning/getElementToPositionHint";
import { getUnderlineRange, spellsLabel } from "./underline/getUnderlineRange";
import { getUnderlineText } from "./underline/getUnderlineText";
import {
	getUnderlineStyle,
	type UnderlineStyle,
} from "./underline/getUnderlineStyle";
import { hideUnderline, showUnderline } from "./underline/underlineHighlights";

const colorRedString = red.toString();
const colorGreenString = green.toString();

const hintQueue = new Set<Hint>();

function addToHintQueue(hint: Hint) {
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
		if (!hint.label) queue.delete(hint);
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
		hint.shadowHost.dataset["hint"] = hint.label;
		hint.isActive = true;

		// This is here for debugging and testing purposes
		if (
			process.env["NODE_ENV"] !== "production" &&
			hint.target instanceof HTMLElement
		) {
			hint.target.dataset["hint"] = hint.label;
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
			if (hint.label) {
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
				getComputedStyle(descendant).zIndex,
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
				getComputedStyle(current).zIndex,
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
				// Avoid node.shadowRoot (closed shadow DOM in production).
				const label = node.dataset["hint"];

				if (label) {
					const wrapper = getWrapper(label);

					// eslint-disable-next-line max-depth
					if (wrapper?.hint?.label) {
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

/**
 * An underline hint has no element in the page, so none of the observers above
 * notice when the page rewrites the text it is drawn on. When that happens the
 * `Range` collapses, the label silently stops being painted and the element is
 * left with no hint at all. Frameworks that patch the dom in place, which is
 * what a live search does as you type, hit this constantly.
 */
const underlinedTargets = new Map<Element, Hint>();
const targetsWithChangedText = new Set<Element>();

const underlineMutationObserver = new MutationObserver((entries) => {
	for (const entry of entries) {
		const element =
			entry.target instanceof Element
				? entry.target
				: entry.target.parentElement;

		if (element) targetsWithChangedText.add(element);
	}

	if (targetsWithChangedText.size > 0) refreshUnderlines();
});

const refreshUnderlines = debounce(() => {
	const changed = [...targetsWithChangedText];
	targetsWithChangedText.clear();

	const hints = new Set<Hint>();

	for (const element of changed) {
		// The mutation can be on a descendant of the hinted element.
		let current: Element | null = element;
		while (current) {
			const hint = underlinedTargets.get(current);
			if (hint) {
				hints.add(hint);
				break;
			}

			current = current.parentElement;
		}
	}

	// An underline can only carry a label the text spells, so when the text no
	// longer spells it the hint needs a different label rather than a different
	// position. We release those in one go and claim again for all of them at
	// once, which also lets the stack match the new text.
	let needsRelabelling = false;
	for (const hint of hints) {
		if (!hint.refreshUnderline()) {
			hint.release();
			needsRelabelling = true;
		}
	}

	if (needsRelabelling) void rehintPending();
}, 100);

// =============================================================================
// HINT
// =============================================================================
export class Hint {
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
	keyEmphasis?: boolean;
	freezeColors?: boolean;
	label?: string;

	/**
	 * When the label of this hint is rendered by underlining two characters of
	 * the text of the target, the `Range` covering those two characters.
	 * Underline hints have no element attached to the page, so most of the
	 * methods that deal with the hint element are a no-op for them.
	 */
	underlineRange?: Range;

	/**
	 * How the underline is drawn. When the page already underlines the text it
	 * follows the offset and color of the page's own line, so that ours sits just
	 * below it and matches it.
	 */
	underlineStyle: UnderlineStyle = { offset: 3, color: "currentColor" };

	constructor(public target: Element) {
		this.isActive = false;

		this.shadowHost = document.createElement("div");
		this.shadowHost.className = "rango-hint";
		setStyleProperties(this.shadowHost, {
			display: "contents",
		});

		shadowHostMutationObserver.observe(this.shadowHost, { attributes: true });

		// We need to keep the shadow DOM open when testing as some tests rely on
		// it. In production we keep it closed to avoid the possibility of the
		// shadowRoot being accessed by the page and causing issues (#679).
		const mode = process.env["NODE_ENV"] === "production" ? "closed" : "open";
		const shadow = this.shadowHost.attachShadow({ mode });

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
			"font-variant": "initial",
		});

		this.outer.append(this.inner);
		shadow.append(this.outer);

		// Hide the hint if it's the currently focused element.
		if (isEditable(this.target)) {
			if (document.hasFocus() && this.target === document.activeElement) {
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

		this.applyDefaultStyle();
	}

	setBackgroundColor(colorString?: string) {
		setStyleProperties(this.inner, {
			"background-color":
				colorString ?? resolveBackgroundColor(this.target).toString(),
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
		this.elementToPositionHint = this.elementToPositionHint?.isConnected
			? this.elementToPositionHint
			: getElementToPositionHint(this.target);

		const referenceElement =
			this.elementToPositionHint instanceof Text
				? this.elementToPositionHint.parentElement!
				: this.elementToPositionHint;

		this.backgroundColor = getHintBackgroundColor(
			this.target,
			referenceElement
		);
		this.color = getHintForegroundColor(
			this.target,
			this.backgroundColor,
			referenceElement
		);
	}

	updateColors() {
		if (this.underlineRange) return;

		if (!this.target.isConnected) {
			return;
		}

		this.computeColors();

		if (!this.freezeColors) {
			const borderColor = this.color.clone();
			borderColor.alpha = this.keyEmphasis ? 0.7 : 0.3;

			const hintBorderWidth = settingsSync.get("hintBorderWidth");
			const borderWidth = this.keyEmphasis
				? hintBorderWidth + 1
				: hintBorderWidth;
			const border = `${borderWidth}px solid ${borderColor.toString()}`;

			const isIncludeMarked = matchesStagedSelector(this.target, true);
			const isExcludeMarked = matchesStagedSelector(this.target, false);

			const outline = isIncludeMarked
				? `2px solid ${colorGreenString}`
				: isExcludeMarked
					? `2px dashed ${colorRedString}`
					: "none";

			setStyleProperties(this.inner, {
				"background-color": this.backgroundColor.toString(),
				color: this.color.toString(),
				margin: `${this.keyEmphasis ? -1 : 0}px`,
				border,
				outline,
			});
		}
	}

	/**
	 * @param assignment - The label reserved for this element in the current
	 * batch, if its text can be underlined. Without one the hint takes any label
	 * from the cache and is rendered the usual way.
	 */
	claim(assignment?: LabelAssignment) {
		const label = assignment?.label ?? popLabel();

		if (!label) {
			console.warn("No more labels available");
			return;
		}

		const underlineText = assignment?.underlineText;
		this.label = label;

		// If the label was matched against the text of the target we render it by
		// underlining the two characters it corresponds to. The range can still
		// fail to materialize, for example if the characters ended up on different
		// lines, in which case we fall back to a regular hint with the same label.
		this.underlineRange = underlineText
			? getUnderlineRange(this.target, underlineText, label)
			: undefined;

		if (this.underlineRange) {
			this.underlineStyle = getUnderlineStyle(
				this.underlineRange.startContainer as Text
			);
		}

		// We need to set the hinted wrapper here and not when the hint is shown in
		// processHintQueue. This way if the labels are updated this Hint will be
		// taken into account and its label refreshed even if the hint is still not
		// visible.
		setHintedWrapper(this.label, this.target);

		if (this.underlineRange) {
			underlinedTargets.set(this.target, this);
			underlineMutationObserver.observe(this.target, {
				childList: true,
				subtree: true,
				characterData: true,
			});

			if (getToggles().computed) this.showUnderline();
			this.isActive = true;
		} else {
			this.inner.textContent = label;
			addToHintQueue(this);
		}

		if (
			process.env["NODE_ENV"] !== "production" &&
			this.underlineRange &&
			this.target instanceof HTMLElement
		) {
			this.target.dataset["hint"] = label;
		}

		return label;
	}

	/**
	 * Displays the underline for this hint with the style that corresponds to
	 * its current state.
	 */
	showUnderline(state: "default" | "emphasis" | "flash" = "default") {
		if (!this.underlineRange) return;
		showUnderline(this.underlineRange, this.underlineStyle, state);
	}

	/**
	 * Rebuilds the underline after the page has changed the text it is drawn on.
	 *
	 * @returns `false` when the text can no longer spell this label, so the
	 * caller can release it and claim one that the new text can.
	 */
	refreshUnderline() {
		const { underlineRange, label } = this;
		if (!underlineRange || !label) return true;

		// Nothing to do while the range still spells the label.
		if (
			!underlineRange.collapsed &&
			spellsLabel(underlineRange.toString(), label)
		) {
			return true;
		}

		// The same label might still be spelled elsewhere in the element, which
		// keeps the hint stable when only part of the text changed.
		const underlineText = this.target.isConnected
			? getUnderlineText(this.target)
			: undefined;
		const range = underlineText
			? getUnderlineRange(this.target, underlineText, label)
			: undefined;

		if (range) {
			hideUnderline(underlineRange);
			this.underlineRange = range;
			this.underlineStyle = getUnderlineStyle(range.startContainer as Text);
			this.showUnderline(this.keyEmphasis ? "emphasis" : "default");
			return true;
		}

		return false;
	}

	/**
	 * The rect the hint occupies on screen, used to anchor tooltips. For
	 * underline hints it's the two underlined characters.
	 */
	getAnchorRect() {
		return this.underlineRange
			? this.underlineRange.getBoundingClientRect()
			: this.inner.getBoundingClientRect();
	}

	position() {
		// Underline hints are drawn on the text itself, there is nothing to
		// position.
		if (this.underlineRange) return;

		// We avoid repositioning while the key is emphasized to avoid small
		// movements of the hint when adding the outline.
		if (this.keyEmphasis) return;

		// This guards against Hint.position being called before its context has
		// been computed. For example, if it's
		if (!this.container) return;

		// We need to calculate this here the first time the hint is appended
		if (this.wrapperRelative === undefined) {
			const { display } = getComputedStyle(
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
			const { fontSize } = getComputedStyle(
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

		// Prevent the hint being flipped when the container is flipped with
		// scaleY(-1).
		if (
			this.container instanceof HTMLElement &&
			isFlippedWithScaleY(this.container)
		) {
			setStyleProperties(this.outer, {
				transform: "scaleY(-1)",
			});
		}

		this.positioned = true;
	}

	flash(ms = 300) {
		if (this.underlineRange) {
			const range = this.underlineRange;
			this.showUnderline("flash");

			setTimeout(() => {
				if (this.underlineRange === range) this.showUnderline();
			}, ms);

			return;
		}

		setStyleProperties(this.inner, {
			"background-color": this.color.toString(),
			color: this.backgroundColor.toString(),
		});

		this.freezeColors = true;

		setTimeout(() => {
			this.freezeColors = false;
			this.updateColors();
		}, ms);
	}

	clearFlash() {
		if (this.underlineRange) {
			this.showUnderline();
			return;
		}

		setStyleProperties(this.inner, {
			"background-color": this.backgroundColor.toString(),
			color: this.color.toString(),
		});

		this.freezeColors = false;
	}

	release(returnToStack = true, removeElement = true) {
		if (hintQueue.has(this)) hintQueue.delete(this);
		this.isActive = false;

		// Checking this.string is safer than check in this.inner.textContent as the
		// latter could be removed by a page script
		if (!this.label) return;

		clearHintedWrapper(this.label);

		if (this.underlineRange) {
			hideUnderline(this.underlineRange);
			this.underlineRange = undefined;
			underlinedTargets.delete(this.target);

			if (returnToStack) pushLabel(this.label);
			this.label = undefined;

			if (
				process.env["NODE_ENV"] !== "production" &&
				this.target instanceof HTMLElement
			) {
				delete this.target.dataset["hint"];
			}

			return;
		}

		if (removeElement) {
			setStyleProperties(this.inner, {
				display: "none",
			});
		}

		if (returnToStack) pushLabel(this.label);
		this.inner.textContent = "";
		this.label = undefined;

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
		if (this.underlineRange) {
			hideUnderline(this.underlineRange);
			return;
		}

		setStyleProperties(this.inner, {
			display: "none",
			opacity: "0%",
		});
	}

	show() {
		if (this.underlineRange) {
			this.showUnderline(this.keyEmphasis ? "emphasis" : "default");
			return;
		}

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
		// The style of underline hints comes from the `::highlight()` rules, there
		// is nothing to apply per hint.
		if (this.underlineRange) return;

		const hintFontFamily = settingsSync.get("hintFontFamily");
		const hintFontSize = settingsSync.get("hintFontSize");
		const hintBorderWidth = settingsSync.get("hintBorderWidth");
		const hintBorderRadius = settingsSync.get("hintBorderRadius");
		const hintUppercaseLetters = settingsSync.get("hintUppercaseLetters");
		const hintFontBold = settingsSync.get("hintFontBold");
		this.computeColors();

		const borderColor = this.color.clone();
		borderColor.alpha = this.keyEmphasis ? 0.7 : 0.3;

		setStyleProperties(this.inner, {
			"background-color": this.backgroundColor.toString(),
			color: this.color.toString(),
			border: `${hintBorderWidth}px solid ${borderColor.toString()}`,
			"font-family": hintFontFamily,
			"font-size": `${hintFontSize}px`,
			"font-weight": hintFontBold ? "bold" : "normal",
			"border-radius": `${hintBorderRadius}px`,
			"text-transform": hintUppercaseLetters ? "uppercase" : "none",
			"outline-offset": "1px",
			margin: `${this.keyEmphasis ? -1 : 0}px`,
		});
	}

	keyHighlight() {
		this.keyEmphasis = true;

		if (this.underlineRange) {
			this.showUnderline("emphasis");
			return;
		}

		this.updateColors();
	}

	clearKeyHighlight() {
		this.keyEmphasis = false;

		if (this.underlineRange) {
			this.showUnderline();
			return;
		}

		this.updateColors();
	}
}
