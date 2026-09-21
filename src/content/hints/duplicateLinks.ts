import { type ElementWrapper } from "../wrappers/ElementWrapper";

/**
 * Pages often give the same destination more than one link: a thumbnail next to
 * a title, an author's avatar next to their name, a result's url above its
 * heading. Hinting each of them costs a label and makes the page busier without
 * offering anything new, so only one of them gets a hint.
 *
 * Two links are the same offering when they point to the same place and nothing
 * separates them. What separates them is a landmark: a link in the navigation
 * and a link in the page body do the same thing but are not the same offering,
 * and neither are the same category tag on two different cards.
 */

const landmarkSelector =
	"article, aside, footer, header, main, nav, section, form, " +
	"[role=article], [role=banner], [role=complementary], [role=contentinfo], " +
	"[role=form], [role=main], [role=navigation], [role=region], [role=search]";

/**
 * An article is the boundary that counts, even when it has landmarks of its
 * own. A card's heading often sits in a `header` of its own, with the link that
 * repeats it outside, and those two are still the same offering.
 */
const articleSelector = "article, [role=article]";

/**
 * We only look at the beginning of the text, like `getUnderlineText` does.
 * Anything past it can't change which of two links is the prominent one.
 */
const maxTextNodes = 10;

const linksByHref = new Map<string, Set<ElementWrapper>>();
const hrefs = new WeakMap<ElementWrapper, string>();

/**
 * Guards against a settle triggering another one while it runs.
 */
let settling = false;

export function trackLink(wrapper: ElementWrapper) {
	const href = getHref(wrapper.element);
	const previous = hrefs.get(wrapper);

	if (href === previous) return;
	if (previous) removeFrom(previous, wrapper);

	if (!href) {
		hrefs.delete(wrapper);
		return;
	}

	hrefs.set(wrapper, href);
	const group = linksByHref.get(href) ?? new Set();
	group.add(wrapper);
	linksByHref.set(href, group);

	// A new link can take the place of one that is already hinted, or be taken
	// over by it, so the rest of the group has to be looked at again.
	settle(group, wrapper);
}

export function untrackLink(wrapper: ElementWrapper) {
	const href = hrefs.get(wrapper);
	if (!href) return;

	hrefs.delete(wrapper);
	const group = removeFrom(href, wrapper);
	if (group) settle(group, wrapper);
}

/**
 * Returns `true` if another link to the same place, with nothing between them,
 * shows this one's destination more prominently.
 *
 * Note that this can't tell that a link has a click handler doing something
 * other than following its href. Requiring the two to sit in the same region
 * keeps that rare, but it is the reason ties are kept rather than broken
 * arbitrarily.
 */
export function isDuplicateOfNearbyLink(wrapper: ElementWrapper) {
	const href = hrefs.get(wrapper);
	if (!href) return false;

	const group = linksByHref.get(href);
	if (!group || group.size < 2) return false;

	const region = getRegion(wrapper.element);
	if (!region) return false;

	const size = getTextSize(wrapper.element);

	for (const other of group) {
		if (other === wrapper || !other.isHintable) continue;
		if (!other.element.isConnected) continue;
		if (getRegion(other.element) !== region) continue;

		// Ties keep both. Two links with text of the same size are as likely to be
		// two offerings as one, and leaving a hint in place costs less than taking
		// away the only way to reach something.
		if (getTextSize(other.element) > size) return true;
	}

	return false;
}

function removeFrom(href: string, wrapper: ElementWrapper) {
	const group = linksByHref.get(href);
	if (!group) return undefined;

	group.delete(wrapper);
	if (group.size === 0) linksByHref.delete(href);

	return group;
}

function settle(group: Set<ElementWrapper>, except: ElementWrapper) {
	if (settling || group.size === 0) return;

	settling = true;
	try {
		for (const wrapper of group) {
			if (wrapper !== except && wrapper.element.isConnected) {
				wrapper.updateShouldBeHinted();
			}
		}
	} finally {
		settling = false;
	}
}

/**
 * What makes two links the same offering, or `undefined` when the link doesn't
 * have one we can compare.
 *
 * The target is part of it: a link that opens a new tab and one that doesn't
 * lead to the same page by different means, and dropping either would change
 * what the remaining hint does.
 *
 * Same page anchors are left out: two of them are as likely to be a skip link
 * and a heading as they are to be the same offering.
 */
function getHref(element: Element) {
	if (!(element instanceof HTMLAnchorElement)) return undefined;

	const attribute = element.getAttribute("href");
	if (!attribute || attribute.startsWith("#")) return undefined;
	if (/^\s*javascript:/i.test(attribute)) return undefined;
	if (!element.href) return undefined;

	return `${element.href}\n${element.target}`;
}

/**
 * The element that bounds what this link belongs to. Two links share an
 * offering only when they share one of these.
 */
function getRegion(element: Element) {
	const parent = element.parentElement;
	if (!parent) return undefined;

	// Walking up to the nearest landmark is the same thing as asking which
	// landmarks lie between the link and anything it might be grouped with,
	// since a nearer one would be found first.
	return (
		parent.closest(articleSelector) ??
		parent.closest(landmarkSelector) ??
		document.body
	);
}

/**
 * The size of the largest visible text in the link, or 0 when it has none. A
 * link showing only a thumbnail scores 0 and loses to the one showing a title,
 * so this covers both telling text from no text and telling a heading from the
 * small print under it.
 */
function getTextSize(element: Element) {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	let size = 0;
	let nodesSeen = 0;

	while (nodesSeen < maxTextNodes) {
		const node = walker.nextNode() as Text | null;
		if (!node) break;

		if (!node.textContent || !/\S/.test(node.textContent)) continue;

		nodesSeen++;
		const { parentElement } = node;
		if (!parentElement) continue;

		const { visibility, opacity, fontSize } = getComputedStyle(parentElement);
		if (visibility === "hidden" || opacity === "0") continue;

		size = Math.max(size, Number.parseFloat(fontSize) || 0);
	}

	return size;
}
