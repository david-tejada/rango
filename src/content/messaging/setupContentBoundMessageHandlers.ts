import { clickElement } from "../actions/clickElement";
import { getElementTextContent } from "../actions/copy";
import { focus, focusFirstInput } from "../actions/focus";
import { getAnchorHref } from "../actions/getAnchorHref";
import {
	markHintsAsKeyboardReachable,
	restoreKeyboardReachableHints,
} from "../actions/keyboardClicking";
import {
	navigateToNextPage,
	navigateToPreviousPage,
} from "../actions/pagination";
import { showTitleAndHref } from "../actions/showTitleAndHref";
import { reclaimHintsFromCache } from "../hints/hintsCache";
import { deleteHintsInFrame } from "../hints/hintsInFrame";
import { synchronizeHints } from "../hints/hintsRequests";
import {
	allowToastNotification,
	notify,
	notifyTogglesStatus,
} from "../notify/notify";
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
	const intersecting = getWrapper(target).filter(
		(wrapper) => wrapper.isIntersectingViewport
	);

	for (const wrapper of intersecting) wrapper.hint?.flash();

	return intersecting;
}

export function setupContentBoundMessageHandlers() {
	// =============================================================================
	// OPERATIONAL
	// =============================================================================
	onMessage("pingContentScript", () => true);

	onMessage("onCompleted", async () => {
		await synchronizeHints();
	});

	onMessage("displayToastNotification", async ({ text, options }) => {
		await notify(text, options);
	});

	onMessage("allowToastNotification", allowToastNotification);

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

	// =============================================================================
	// COMMANDS WITH TARGET
	// =============================================================================
	onMessage("clickElement", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		return clickElement(wrappers);
	});

	onMessage("directClickElement", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		if (wrappers.length === 0) {
			return { noHintFound: true };
		}

		return clickElement(wrappers);
	});

	onMessage("getElementTextContent", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		return getElementTextContent(wrappers);
	});

	onMessage("tryToFocusElementAndCheckIsEditable", async ({ target }) => {
		const wrapper = getIntersectingWrappers(target)[0];
		if (!wrapper) return false;

		const activeEditable = await activateEditable(wrapper);
		return Boolean(activeEditable);
	});

	onMessage("focusElement", ({ target }) => {
		const wrapper = getIntersectingWrappers(target)[0];
		if (!wrapper) return { focusPage: false };
		const focusWasPerformed = focus(wrapper);
		return { focusPage: focusWasPerformed ? !document.hasFocus() : false };
	});

	onMessage("showLink", ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		showTitleAndHref(wrappers);
	});

	onMessage("getAnchorHref", async ({ target, showCopyTooltip }) => {
		const wrappers = getIntersectingWrappers(target);
		return getAnchorHref(wrappers, showCopyTooltip);
	});

	// =============================================================================
	// COMMANDS WITHOUT TARGET
	// =============================================================================
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
}
