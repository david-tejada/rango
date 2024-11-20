import tippy from "tippy.js";
import { type ElementWrapper } from "../wrappers/ElementWrapper";
import { setStyleProperties } from "./setStyleProperties";

export function showTooltip(
	wrapper: ElementWrapper,
	text: string,
	duration = 3000
) {
	if (!wrapper.hint) return;

	const tooltipAnchor = document.createElement("div");
	tooltipAnchor.className = "rango-tooltip";

	const { x, y, width, height } = wrapper.hint.inner.getBoundingClientRect();

	const scrollLeft =
		window.pageXOffset ||
		document.documentElement.scrollLeft ||
		document.body.scrollLeft;

	const scrollTop =
		window.pageYOffset ||
		document.documentElement.scrollTop ||
		document.body.scrollTop;

	setStyleProperties(tooltipAnchor, {
		width: `${width}px`,
		height: `${height}px`,
		position: "absolute",
		left: `${scrollLeft + x}px`,
		top: `${scrollTop + y}px`,
	});

	tooltipAnchor.dataset["tippyContent"] = text;
	document.body.append(tooltipAnchor);

	const instance = tippy(tooltipAnchor, {
		zIndex: 2_147_483_647,
		appendTo: tooltipAnchor,
		maxWidth: "none",
		allowHTML: true, // eslint-disable-line @typescript-eslint/naming-convention
	});

	function handleScroll(event: Event) {
		if (
			(event.target instanceof Element || event.target instanceof Document) &&
			event.target.contains(wrapper.element)
		) {
			clearTooltip();
		}
	}

	function clearTooltip() {
		// We make sure that the tooltip is only cleared once.
		window.removeEventListener("scroll", handleScroll);
		clearTimeout(timeout);

		instance.hide();
		wrapper.hint?.clearFlash();

		// We remove the element after leaving sometime for the fade out to finish.
		setTimeout(() => {
			tooltipAnchor.remove();
		}, 500);
	}

	instance.show();
	wrapper.hint.flash(duration);

	// Because we need to position the tooltip absolutely to avoid it being
	// clipped, we need to remove it once the user starts scrolling.
	window.addEventListener("scroll", handleScroll, {
		once: true,
	});

	const timeout = setTimeout(() => {
		clearTooltip();
	}, duration);
}
