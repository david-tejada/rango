/**
 * Selector for most common elements except `div`. It's unlikely that these
 * elements will have a shadow root. Most elements that have a shadow root are
 * custom elements.
 */
const commonElementExceptDivSelector =
	"a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, blockquote, body, br, button, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, dl, dt, ellipse, em, embed, fieldset, figcaption, figure, footer, form, g, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, image, img, input, ins, kbd, label, legend, li, line, link, main, map, mark, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, param, path, picture, polygon, polyline, pre, progress, q, rect, rp, rt, ruby, s, samp, script, section, select, small, source, span, stop, strong, style, sub, summary, sup, svg, table, tbody, td, template, text, textarea, tfoot, th, thead, time, title, tr, track, tspan, u, ul, var, video, wbr";

const rangoElementSelector = ".rango-hint, #rango-toast";

/**
 * Retrieve all elements starting from root, including those inside shadow DOMs
 * or even nested shadow DOMs.
 *
 * @param root - The root element to start the search from.
 * @param includeRoot - Whether to include the root element in the result.
 * @param selector - The selector to filter the elements.
 * @returns An array of all elements starting from root, including those inside
 * shadow DOMs or even nested shadow DOMs.
 */
export function deepGetElements(
	root: Element,
	includeRoot = true,
	selector = `:not(${rangoElementSelector})`
): Element[] {
	const rootOrShadowRoot = root.shadowRoot ?? root;
	const elementList = rootOrShadowRoot.querySelectorAll(selector);

	const possibleShadowHosts = rootOrShadowRoot.querySelectorAll(
		`:not(${rangoElementSelector}, ${commonElementExceptDivSelector})`
	);

	const shadowHosts = [...possibleShadowHosts].filter((element) => {
		return isShadowHost(element);
	});

	const shadowRootElements = shadowHosts.flatMap((shadowHost) => {
		return deepGetElements(shadowHost, false, selector);
	});

	return [
		...(includeRoot && root.matches(selector) ? [root] : []),
		...elementList,
		...shadowRootElements,
	];
}

function isShadowHost(
	element: Element
): element is Element & { shadowRoot: ShadowRoot } {
	return element.shadowRoot !== null;
}
