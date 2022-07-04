import browser from "webextension-polyfill";
import {
	ContentRequest,
	ScriptResponse,
	WindowLocationKeys,
} from "../typing/types";
import { cacheHintOptions } from "./options/hint-style-options";
import {
	getClipboardManifestV3,
	copyToClipboardManifestV3,
} from "./utils/manifest-v3-clipboard";
import { clickElement } from "./actions/click-element";
import { openInNewTab, openInBackgroundTab } from "./actions/open-in-new-tab";
import { showTitleAndHref } from "./actions/show";
import { hoverElement, unhoverAll } from "./actions/hover";
import { triggerHintsUpdate } from "./hints/display-hints";
import observe from "./observers";
import { NoHintError } from "./classes/errors";
import {
	copyElementTextContentToClipboard,
	copyLinkToClipboard,
	copyMarkdownLinkToClipboard,
	copyToClipboardResponse,
} from "./actions/copy";
import { addUrlToTitle } from "./utils/url-in-title";
import {
	scrollVerticallyAtElement,
	scrollPageVertically,
	scrollElementToTop,
	scrollElementToBottom,
	scrollElementToCenter,
} from "./actions/scroll";
import { setNavigationToggle } from "./hints/should-display-hints";
import {
	markHintsAsKeyboardReachable,
	initKeyboardNavigation,
	restoreKeyboardReachableHints,
} from "./keyboard-clicking";
import { updateHintsInTab } from "./utils/get-hints-in-tab";
import { listenToScrollAndResizeEvents } from "./utils/listen-to-scroll-and-resize-events";

cacheHintOptions()
	.then(addUrlToTitle)
	.then(observe)
	.then(listenToScrollAndResizeEvents)
	.then(async () => {
		const { keyboardClicking } = await browser.storage.local.get(
			"keyboardClicking"
		);
		if (keyboardClicking) {
			await initKeyboardNavigation();
		}
	})
	.catch((error) => {
		console.error(error);
	});

browser.runtime.onMessage.addListener(
	async (request: ContentRequest): Promise<ScriptResponse | undefined> => {
		try {
			switch (request.type) {
				// SCRIPT REQUESTS
				case "getClipboardManifestV3":
					return { text: getClipboardManifestV3() };

				case "copyToClipboardManifestV3": {
					const text = request.text;
					copyToClipboardManifestV3(text);
					break;
				}

				case "getLocation":
					return {
						host: window.location.host,
						origin: window.location.origin,
						pathname: window.location.pathname,
					};

				case "updateHintsInTab":
					updateHintsInTab(request.hints);
					break;

				case "markHintsAsKeyboardReachable":
					markHintsAsKeyboardReachable(request.letter);
					break;

				case "restoreKeyboardReachableHints":
					restoreKeyboardReachableHints();
					break;

				case "initKeyboardNavigation":
					await initKeyboardNavigation();
					break;

				// RANGO ACTIONS
				case "clickElement":
				case "directClickElement": {
					await clickElement(request.target);
					break;
				}

				case "scrollUpAtElement":
					scrollVerticallyAtElement("up", request.target, request.arg);
					break;

				case "scrollDownAtElement":
					scrollVerticallyAtElement("down", request.target, request.arg);
					break;

				case "scrollElementToTop":
					scrollElementToTop(request.target);
					break;

				case "scrollElementToBottom":
					scrollElementToBottom(request.target);
					break;

				case "scrollElementToCenter":
					scrollElementToCenter(request.target);
					break;

				case "scrollUpPage":
					scrollPageVertically("up", request.arg);
					break;

				case "scrollDownPage":
					scrollPageVertically("down", request.arg);
					break;

				case "copyLink":
					return copyLinkToClipboard(request.target);

				case "copyMarkdownLink":
					return copyMarkdownLinkToClipboard(request.target);

				case "copyElementTextContent":
					return copyElementTextContentToClipboard(request.target);

				case "copyLocationProperty":
					return copyToClipboardResponse(
						window.location[request.arg as WindowLocationKeys]
					);

				case "showLink":
					showTitleAndHref(request.target);
					break;

				case "openInNewTab":
					await openInNewTab(request.target);
					break;

				case "openInBackgroundTab":
					await openInBackgroundTab(request.target);
					break;

				case "hoverElement":
					await hoverElement(request.target);
					break;

				case "unhoverAll":
					unhoverAll();
					break;

				case "refreshHints":
					await triggerHintsUpdate(true);
					break;

				case "enableHintsNavigation":
					setNavigationToggle(true);
					await triggerHintsUpdate(true);
					break;

				case "disableHintsNavigation":
					setNavigationToggle(false);
					await triggerHintsUpdate(true);
					break;

				case "fullHintsUpdate":
					await triggerHintsUpdate(true);
					break;

				case "fullHintsUpdateOnIdle":
					window.requestIdleCallback(async () => {
						await triggerHintsUpdate(true);
					});
					break;

				default:
					break;
			}
		} catch (error: unknown) {
			if (
				request.type === "directClickElement" &&
				error instanceof NoHintError
			) {
				return {
					talonAction: {
						type: "noHintFound",
					},
				};
			}

			console.error(error);
		}

		return undefined;
	}
);
