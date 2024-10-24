import { clickElement } from "../actions/clickElement";
import { copyElementTextContent } from "../actions/copy";
import { focus } from "../actions/focus";
import {
	markHintsAsKeyboardReachable,
	restoreKeyboardReachableHints,
} from "../actions/keyboardClicking";
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
import { updateHintsInTab } from "../utils/getHintsInTab";
import { getWrapper, reclaimHints } from "../wrappers/wrappers";
import { onMessage } from "./contentMessageBroker";

function getIntersectingWrappers(target: string[]) {
	return getWrapper(target).filter((wrapper) => wrapper.isIntersectingViewport);
}

export function setupContentBoundMessageHandlers() {
	// =============================================================================
	// OPERATIONAL
	// =============================================================================
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

	onMessage("updateHintsInTab", ({ hints }) => {
		updateHintsInTab(hints);
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

	onMessage("copyElementTextContent", async ({ target }) => {
		const wrappers = getIntersectingWrappers(target);
		return copyElementTextContent(wrappers);
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
}
