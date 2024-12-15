import { toast } from "react-toastify";
import { activateEditable } from "../actions/activateEditable";
import { clickElement } from "../actions/clickElement";
import {
	scrollToPosition,
	storeScrollPosition,
} from "../actions/customScrollPositions";
import { blur, focus, focusFirstInput } from "../actions/focus";
import {
	getAnchorHref,
	getElementTextContent,
	getMarkdownLink,
} from "../actions/getElementInfo";
import { hoverElement, unhoverAll } from "../actions/hoverElement";
import {
	markHintsAsKeyboardReachable,
	restoreKeyboardReachableHints,
} from "../actions/keyboardClicking";
import { matchElementByText } from "../actions/matchElementByText";
import {
	navigateToNextPage,
	navigateToPreviousPage,
} from "../actions/pagination";
import {
	getReferences,
	saveReference,
	saveReferenceForActiveElement,
	showReferences,
} from "../actions/references";
import { scroll, snapScroll } from "../actions/scroll";
import { setSelectionAfter, setSelectionBefore } from "../actions/setSelection";
import { showTitleAndHref } from "../actions/showTitleAndHref";
import { getElementFromSelector } from "../dom/getElementFromSelector";
import { isEditable } from "../dom/utils";
import { notify, notifyTogglesStatus } from "../feedback/notify";
import {
	displayMoreOrLessHints,
	markAllHintsForExclusion,
	markHintsForExclusion,
	markHintsForInclusion,
	markHintsWithBroaderSelector,
	markHintsWithNarrowerSelector,
	refreshCustomHints,
} from "../hints/customHints/customHints";
import { getStagedSelectors } from "../hints/customHints/customSelectorsStaging";
import { reclaimLabelsFromCache } from "../hints/labels/labelCache";
import { synchronizeLabels } from "../hints/labels/labelRequest";
import { deleteLabelsInFrame } from "../hints/labels/labelsInFrame";
import { refreshHints } from "../hints/refreshHints";
import { updateHintsEnabled } from "../observe";
import { setNavigationToggle } from "../settings/toggles";
import {
	getTitleBeforeDecoration,
	updateTitleDecorations,
} from "../setup/decorateTitle";
import { getFirstWrapper, getTargetedWrappers } from "../wrappers/target";
import { reclaimLabels } from "../wrappers/wrappers";
import { onMessage } from "./contentMessageBroker";

export function addMessageListeners() {
	onMessage("pingContentScript", () => true);

	onMessage("onCompleted", async () => {
		await synchronizeLabels();
	});

	onMessage("checkIfDocumentHasFocus", () => document.hasFocus());

	onMessage("tryToFocusPage", () => {
		window.focus();
	});

	onMessage("hasActiveEditableElement", () => {
		return Boolean(
			document.hasFocus() &&
				document.activeElement &&
				isEditable(document.activeElement)
		);
	});

	onMessage("displayToastNotification", async ({ text, type, toastId }) => {
		await notify[type](text, toastId);
	});

	onMessage("displayTogglesStatus", async ({ force }) => {
		await notifyTogglesStatus(force);
	});

	onMessage("updateNavigationToggle", async ({ enable }) => {
		setNavigationToggle(enable);
		await updateHintsEnabled();
		await notifyTogglesStatus();
	});

	onMessage("refreshHints", refreshHints);

	onMessage("reclaimLabels", async ({ amount }) => {
		const reclaimed = reclaimLabelsFromCache(amount);
		if (reclaimed.length < amount) {
			reclaimed.push(...reclaimLabels(amount - reclaimed.length));
		}

		deleteLabelsInFrame(reclaimed);
		return reclaimed;
	});

	onMessage("hideHint", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);

		for (const wrapper of wrappers) wrapper.hint?.hide();
	});

	onMessage("markHintsAsKeyboardReachable", async ({ letter }) => {
		markHintsAsKeyboardReachable(letter);
	});

	onMessage("restoreKeyboardReachableHints", restoreKeyboardReachableHints);

	onMessage("getTitleBeforeDecoration", getTitleBeforeDecoration);

	onMessage("refreshTitleDecorations", updateTitleDecorations);

	onMessage("clickElement", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);
		return clickElement(wrappers);
	});

	onMessage("getElementTextContent", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);
		return getElementTextContent(wrappers);
	});

	onMessage("getElementMarkdownLink", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);
		return getMarkdownLink(wrappers);
	});

	onMessage("focusElement", async ({ target }) => {
		const wrapper = await getFirstWrapper(target);

		const focusWasPerformed = focus(wrapper);
		return { focusPage: focusWasPerformed ? !document.hasFocus() : false };
	});

	onMessage("tryToFocusElementAndCheckIsEditable", async ({ target }) => {
		const wrapper = await getFirstWrapper(target);

		const activeEditable = await activateEditable(wrapper);
		return Boolean(activeEditable);
	});

	onMessage("focusFirstInput", focusFirstInput);

	onMessage("hoverElement", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);
		await hoverElement(wrappers);
	});

	onMessage("unhoverAll", () => {
		blur();
		unhoverAll();
		toast.dismiss();
	});

	onMessage("showLink", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);
		showTitleAndHref(wrappers);
	});

	onMessage("getAnchorHref", async ({ target, showCopyTooltip }) => {
		const wrappers = await getTargetedWrappers(target);
		return getAnchorHref(wrappers, showCopyTooltip);
	});

	onMessage("setSelectionBefore", async ({ target }) => {
		const wrapper = await getFirstWrapper(target);

		return setSelectionBefore(wrapper);
	});

	onMessage("setSelectionAfter", async ({ target }) => {
		const wrapper = await getFirstWrapper(target);

		return setSelectionAfter(wrapper);
	});

	onMessage("scroll", async ({ dir, reference, factor }) => {
		const target =
			typeof reference === "string"
				? reference
				: await getFirstWrapper(reference);

		scroll({ dir, target, factor });
	});

	onMessage("snapScroll", async ({ position, target }) => {
		const wrapper = await getFirstWrapper(target);
		snapScroll(position, wrapper);
	});

	onMessage("storeScrollPosition", async ({ name }) => {
		await storeScrollPosition(name);
	});

	onMessage("scrollToPosition", async ({ name }) => {
		await scrollToPosition(name);
	});

	onMessage("historyGoBack", () => {
		history.back();
	});

	onMessage("historyGoForward", () => {
		history.forward();
	});

	onMessage("navigateToNextPage", navigateToNextPage);

	onMessage("navigateToPreviousPage", navigateToPreviousPage);

	onMessage("navigateToPageRoot", () => {
		location.href = "/";
	});

	onMessage("markHintsForInclusion", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);
		await markHintsForInclusion(wrappers);
	});

	onMessage("markHintsForExclusion", async ({ target }) => {
		const wrappers = await getTargetedWrappers(target);
		await markHintsForExclusion(wrappers);
	});

	onMessage("displayMoreOrLessHints", displayMoreOrLessHints);

	onMessage("markAllHintsForExclusion", markAllHintsForExclusion);

	onMessage("markHintsWithBroaderSelector", markHintsWithBroaderSelector);

	onMessage("markHintsWithNarrowerSelector", markHintsWithNarrowerSelector);

	onMessage("getStagedSelectors", getStagedSelectors);

	onMessage("refreshCustomHints", refreshCustomHints);

	onMessage("saveReference", async ({ target, referenceName }) => {
		const wrapper = await getFirstWrapper(target);
		await saveReference(wrapper, referenceName);
	});

	onMessage("saveReferenceForActiveElement", async ({ referenceName }) => {
		await saveReferenceForActiveElement(referenceName);
	});

	onMessage("showReferences", showReferences);

	onMessage("assertActiveReferenceInFrame", async ({ referenceName }) => {
		const { hostReferences } = await getReferences();
		const selector = hostReferences.get(referenceName);
		if (!selector) throw new Error("No selector found");

		const element = await getElementFromSelector(selector);
		if (!element) throw new Error("No element found");
	});

	onMessage("matchElementByText", async ({ text, prioritizeViewport }) => {
		return matchElementByText(text, prioritizeViewport);
	});
}
