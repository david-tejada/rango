const props =
	/\b(?:position|zIndex|opacity|mixBlendMode|transform|filter|backdrop-filter|perspective|clip-path|mask|mask-image|mask-border|isolation)\b/;

function isFlexOrGridChild(element: Element) {
	const parentDisplay =
		element.parentNode instanceof Element &&
		getComputedStyle(element.parentNode).display;
	return (
		parentDisplay === "flex" ||
		parentDisplay === "inline-flex" ||
		parentDisplay === "-webkit-box" ||
		parentDisplay === "-webkit-flex" ||
		parentDisplay === "-ms-flexbox" ||
		parentDisplay === "grid" ||
		parentDisplay === "inline-grid"
	);
}

export function createsStackingContext(element: Element) {
	// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
	if (element === document.documentElement) return true;

	const style = getComputedStyle(element);

	if (
		style.zIndex !== "auto" &&
		(style.position !== "static" || isFlexOrGridChild(element))
	) {
		return true;
	}

	if (style.position === "fixed" || style.position === "sticky") return true;

	if (Number(style.opacity) < 1) return true;
	if ("mixBlendMode" in style && style.mixBlendMode !== "normal") return true;

	if ("transform" in style && style.transform !== "none") return true;
	if ("filter" in style && style.filter !== "none") return true;
	if ("backdrop-filter" in style && style.filter !== "none") return true;
	if ("perspective" in style && style.filter !== "none") return true;
	if ("clip-path" in style && style.filter !== "none") return true;
	if ("mask" in style && style.filter !== "none") return true;
	if ("mask-image" in style && style.filter !== "none") return true;
	if ("mask-border" in style && style.filter !== "none") return true;

	if ("isolation" in style && style.isolation === "isolate") return true;
	if (props.test(style.willChange)) return true;

	return false;
}
