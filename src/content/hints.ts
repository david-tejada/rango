import browser from "webextension-polyfill";
import { Intersector } from "../types/types";
import { elementIsObscured } from "../lib/dom-utils";
import { applyInitialStyles } from "../lib/styles";
import { getOption } from "../lib/options";
import {
	claimHintText,
	releaseHintText,
	initStack,
	getStack,
	saveStack,
} from "./hints-allocator";
import { intersectors } from "./intersectors";

let displayHintsTimeout: NodeJS.Timeout | undefined;

browser.storage.onChanged.addListener(async (changes) => {
	if ("showHints" in changes) {
		await displayHints(true);
	}
});
function hiddenClickableNeedsRemoved(intersector: Intersector) {
	return (
		(!intersector.isVisible || elementIsObscured(intersector.element)) &&
		intersector.clickableType &&
		intersector.hintText
	);
}

function inViewClickableMissingHint(intersector: Intersector) {
	return (
		intersector.isVisible &&
		!elementIsObscured(intersector.element) &&
		intersector.clickableType &&
		!intersector.hintText
	);
}

function inViewClickablePossessesHint(intersector: Intersector) {
	return (
		intersector.isVisible &&
		!elementIsObscured(intersector.element) &&
		intersector.clickableType &&
		intersector.hintText
	);
}

async function getHintsContainer(): Promise<HTMLElement> {
	let container = document.querySelector("#rango-hints-container");
	if (!container) {
		// This next line will only get executed for frameId === 0
		await initStack();
		container = document.createElement("div");
		container.id = "rango-hints-container";
		document.body.append(container);
	}

	return container as HTMLElement;
}

export async function displayHints(fullRefresh = false) {
	if (fullRefresh) {
		if (displayHintsTimeout) {
			clearTimeout(displayHintsTimeout);
		}

		displayHintsTimeout = undefined;
		document.querySelector("#rango-hints-container")?.remove();
		for (const intersector of intersectors) {
			intersector.hintElement?.remove();
			intersector.hintElement = undefined;
			intersector.hintText = undefined;
		}
	}

	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	const showHints = getOption("showHints");
	if (showHints && !displayHintsTimeout) {
		displayHintsTimeout = setTimeout(async () => {
			displayHintsTimeout = undefined;
			const hintsContainer = await getHintsContainer();
			const stack = await getStack();

			for (const intersector of intersectors) {
				if (hiddenClickableNeedsRemoved(intersector)) {
					intersector.hintElement?.remove();
					intersector.hintElement = undefined;
					releaseHintText(stack, intersector.hintText!);
					intersector.hintText = undefined;
				} else if (inViewClickableMissingHint(intersector)) {
					intersector.hintElement = document.createElement("div");
					intersector.hintText = claimHintText(stack);
					intersector.hintElement.textContent = intersector.hintText ?? "";

					// If there are no more available hints to markup the page, don't
					// append the element.
					if (intersector.hintText) {
						applyInitialStyles(intersector).catch((error) => {
							console.error(error);
						});
						hintsContainer.append(intersector.hintElement as Node);
					}
				} else if (inViewClickablePossessesHint(intersector)) {
					applyInitialStyles(intersector).catch((error) => {
						console.error(error);
					});
				}
			}

			await saveStack(stack);

			if (process.env["NODE_ENV"] !== "production") {
				const hints = intersectors
					.filter((intersector) => intersector.hintText)
					.sort(
						(a, b) =>
							a.hintText!.length - b.hintText!.length ||
							a.hintText!.localeCompare(b.hintText!)
					);
				// console.log("intersectors:", intersectors);
				// console.log("hints:", hints);
			}
		}, 50);
	}
}
