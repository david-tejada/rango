import { isHintableExtra } from "../utils/isHintable";
import { getAllWrappers } from "../wrappers/wrappers";

const i18nPreviousRe =
	/^.{0,3}(previous|newer|anterior|förra|zurück|precedente|préc|前ページ|上一页).{0,3}$/i;
const i18nNextRe =
	/^.{0,3}(next|older|siguiente|próxima|nästa|weiter|successiva|suiv|次ページ|下一页).{0,3}$/i;

function isLinkToNextPage(element: Element) {
	if (
		element.matches("[class*=pagination i]") &&
		(element.matches("[class*=next i]") ||
			element.matches("[class*=right i]")) &&
		!element.matches("[class*=prev i]")
	) {
		return true;
	}

	if (element.matches("[aria-label*='next page' i]")) {
		return true;
	}

	if (element.textContent && i18nNextRe.test(element.textContent)) {
		return true;
	}

	if (
		element instanceof HTMLElement &&
		element.title.toLowerCase() === "next page"
	) {
		return true;
	}

	return false;
}

function isLinkToPreviousPage(element: Element) {
	if (
		element.matches("[class*=pagination i]") &&
		(element.matches("[class*=prev i]") || element.matches("[class*=left i]"))
	) {
		return true;
	}

	if (element.matches("[aria-label*='previous page' i]")) {
		return true;
	}

	if (element.textContent && i18nPreviousRe.test(element.textContent)) {
		return true;
	}

	if (
		element instanceof HTMLElement &&
		element.title.toLowerCase() === "previous page"
	) {
		return true;
	}

	return false;
}

export async function navigateToNextPage() {
	const nextWrapper = getAllWrappers().find(
		(wrapper) =>
			wrapper.element.isConnected &&
			isHintableExtra(wrapper.element) &&
			isLinkToNextPage(wrapper.element)
	);

	await nextWrapper?.click();
}

export async function navigateToPreviousPage() {
	const previousWrapper = getAllWrappers().find(
		(wrapper) =>
			wrapper.element.isConnected &&
			isHintableExtra(wrapper.element) &&
			isLinkToPreviousPage(wrapper.element)
	);

	await previousWrapper?.click();
}
