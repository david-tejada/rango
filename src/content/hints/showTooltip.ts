import tippy from "tippy.js";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { setStyleProperties } from "./setStyleProperties";

export function showTooltip(
	wrapper: ElementWrapper,
	text: string,
	duration: number
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
		allowHTML: true,
	});

	instance.show();
	window.addEventListener(
		"scroll",
		(event) => {
			if (
				(event.target instanceof Element || event.target instanceof Document) &&
				event.target.contains(wrapper.element)
			) {
				instance.hide();
				wrapper.hint?.clearFlash();
			}
		},
		true
	);

	wrapper.hint.flash(duration);

	setTimeout(() => {
		instance.hide();
		wrapper.hint?.clearFlash();
	}, duration);
}
