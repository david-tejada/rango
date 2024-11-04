import { toast } from "react-toastify";
import { TargetError } from "../../common/target/TargetError";
import { clickElement } from "../actions/clickElement";
import { getElementTextContent, getMarkdownLink } from "../actions/copy";
import {
	customHintsConfirm,
	customHintsReset,
	displayMoreOrLessHints,
	markAllHintsForExclusion,
	markHintsForExclusion,
	markHintsForInclusion,
	markHintsWithBroaderSelector,
	markHintsWithNarrowerSelector,
} from "../actions/customHints";
import {
	scrollToPosition,
	storeScrollPosition,
} from "../actions/customScrollPositions";
import { blur, focus, focusFirstInput } from "../actions/focus";
import { getAnchorHref } from "../actions/getAnchorHref";
import { hoverElement, unhoverAll } from "../actions/hoverElement";
import {
	markHintsAsKeyboardReachable,
	restoreKeyboardReachableHints,
} from "../actions/keyboardClicking";
import {
	navigateToNextPage,
	navigateToPreviousPage,
} from "../actions/pagination";
import { refreshHints } from "../actions/refreshHints";
import { scroll, snapScroll } from "../actions/scroll";
import { setSelectionAfter, setSelectionBefore } from "../actions/setSelection";
import { showTitleAndHref } from "../actions/showTitleAndHref";
import { reclaimHintsFromCache } from "../hints/hintsCache";
import { deleteHintsInFrame } from "../hints/hintsInFrame";
import { synchronizeHints } from "../hints/hintsRequests";
import { notify, notifyTogglesStatus } from "../notify/notify";
import { updateHintsEnabled } from "../observe";
import { setNavigationToggle } from "../settings/toggles";
import { activateEditable } from "../utils/activateEditable";
import {
	getTitleBeforeDecoration,
	initTitleDecoration,
	removeDecorations,
} from "../utils/decorateTitle";
import { isEditable } from "../utils/domUtils";
import { getWrapper, reclaimHints } from "../wrappers/wrappers";
import { onMessage } from "./contentMessageBroker";

function getIntersectingWrappers(target: string[]) {
	const wrappers = target.map((hint) => {
		const wrapper = getWrapper(hint);
		if (!wrapper?.isIntersectingViewport) {
			throw new TargetError(`Couldn't find mark "${hint}" in viewport.`);
		}

		return wrapper;
	});

	for (const wrapper of wrappers) wrapper.hint?.flash();

	return wrappers;
}

function getFirstWrapper(target: string[]) {
	return getIntersectingWrappers(target)[0]!;
}

export function setupContentBoundMessageHandlers() {
	onMessage("pingContentScript", () => true);

	onMessage("onCompleted", async () => {
		await synchronizeHints();
	});

	onMessage("displayToastNotification", async ({ text, options }) => {
		await notify(text, options);
	});

	onMessage("displayTogglesStatus", notifyTogglesStatus);

	onMessage("reclaimHints", async ({ amount }) => {
		const reclaimed = reclaimHintsFromCache(amount);
		if (reclaimed.length < amount) {
			reclaimed.push(...reclaimHints(amount - reclaimed.length));
		}

		deleteHintsInFrame(reclaimed);
		return reclaimed;
	});

	onMessage("markHintsAsKeyboardReachable", async ({ letter }) => {
		markHintsAsKeyboardReachable(letter);
	});

	onMessage("restoreKeyboardReachableHints", restoreKeyboardReachableHints);

	onMessage("checkIfDocumentHasFocus", () => document.hasFocus());

	onMessage("updateNavigationToggle", async ({ enable }) => {
		setNavigationToggle(enable);
		await updateHintsEnabled();
		await notifyTogglesStatus();
	});

	onMessage("tryToFocusPage", () => {
		window.focus();
	});

	onMessage("getTitleBeforeDecoration", getTitleBeforeDecoration);

	onMessage("refreshTitleDecorations", async () => {
		removeDecorations();
		await initTitleDecoration();
	});

	onMessage("checkActiveElementIsEditable", () => {
		return Boolean(
			document.hasFocus() &&
				document.activeElement &&
				isEditable(document.activeElement)
		);
	});

	onMessage("clickElement", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		return clickElement(wrappers);
	});

	onMessage("getElementTextContent", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		return getElementTextContent(wrappers);
	});

	onMessage("getElementMarkdownLink", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		return getMarkdownLink(wrappers);
	});

	onMessage("tryToFocusElementAndCheckIsEditable", async ({ target }) => {
		const wrapper = getFirstWrapper(target);

		const activeEditable = await activateEditable(wrapper);
		return Boolean(activeEditable);
	});

	onMessage("focusElement", ({ target }) => {
		const wrapper = getFirstWrapper(target);

		const focusWasPerformed = focus(wrapper);
		return { focusPage: focusWasPerformed ? !document.hasFocus() : false };
	});

	onMessage("hoverElement", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		await hoverElement(wrappers);
	});

	onMessage("showLink", ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		showTitleAndHref(wrappers);
	});

	onMessage("getAnchorHref", async ({ target, showCopyTooltip }) => {
		const wrappers = getIntersectingWrappers(target);
		return getAnchorHref(wrappers, showCopyTooltip);
	});

	onMessage("setSelectionBefore", async ({ target }) => {
		const wrapper = getFirstWrapper(target);

		await setSelectionBefore(wrapper);
	});

	onMessage("setSelectionAfter", async ({ target }) => {
		const wrapper = getFirstWrapper(target);

		await setSelectionAfter(wrapper);
	});

	onMessage("scroll", ({ dir, reference, factor }) => {
		const target =
			reference === "page" ||
			reference === "leftAside" ||
			reference === "rightAside" ||
			reference === "repeatLast"
				? reference
				: getFirstWrapper([reference]);

		scroll({ dir, target, factor });
	});

	onMessage("snapScroll", ({ position, target }) => {
		const wrapper = getFirstWrapper(target);
		snapScroll(position, wrapper);
	});

	onMessage("storeScrollPosition", async ({ name }) => {
		await storeScrollPosition(name);
	});

	onMessage("scrollToPosition", async ({ name }) => {
		await scrollToPosition(name);
	});

	onMessage("historyGoBack", () => {
		window.history.back();
	});

	onMessage("historyGoForward", () => {
		window.history.forward();
	});

	onMessage("navigateToNextPage", navigateToNextPage);

	onMessage("navigateToPreviousPage", navigateToPreviousPage);

	onMessage("navigateToPageRoot", () => {
		window.location.href = "/";
	});

	onMessage("focusFirstInput", focusFirstInput);

	onMessage("unhoverAll", () => {
		blur();
		unhoverAll();
		toast.dismiss();
	});

	onMessage("markHintsForInclusion", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		await markHintsForInclusion(wrappers);
	});

	onMessage("markHintsForExclusion", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		await markHintsForExclusion(wrappers);
	});

	onMessage("displayMoreOrLessHints", displayMoreOrLessHints);

	onMessage("markAllHintsForExclusion", markAllHintsForExclusion);

	onMessage("markHintsWithBroaderSelector", markHintsWithBroaderSelector);

	onMessage("markHintsWithNarrowerSelector", markHintsWithNarrowerSelector);

	onMessage("customHintsConfirm", customHintsConfirm);

	onMessage("customHintsReset", customHintsReset);

	onMessage("hideHint", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);

		for (const wrapper of wrappers) wrapper.hint?.hide();
	});

	onMessage("refreshHints", refreshHints);
}
