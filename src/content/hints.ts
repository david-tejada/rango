import browser from "webextension-polyfill";
import { Intersector } from "../types/types";
import { claimHintText, releaseHintText } from "../lib/utils";
import { elementIsObscured } from "../lib/dom-utils";
import { applyInitialStyles } from "../lib/styles";

let hintsUpdateTriggered = false;

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

function getHintsContainer(): HTMLElement {
	let container = document.querySelector("#rango-hints-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "rango-hints-container";
		document.body.append(container);
	}

	return container as HTMLElement;
}

export async function displayHints(intersectors: Intersector[]) {
	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	const localStorage = await browser.storage.local.get(["showHints"]);
	const showHints = (localStorage["showHints"] as boolean) ?? true;
	if (showHints && !hintsUpdateTriggered) {
		hintsUpdateTriggered = true;

		setTimeout(() => {
			hintsUpdateTriggered = false;

			const hintsContainer = getHintsContainer();

			for (const intersector of intersectors) {
				if (hiddenClickableNeedsRemoved(intersector)) {
					intersector.hintElement?.remove();
					intersector.hintElement = undefined;
					releaseHintText(intersector.hintText);
					intersector.hintText = undefined;
				} else if (inViewClickableMissingHint(intersector)) {
					intersector.hintElement = document.createElement("div");
					intersector.hintText = claimHintText();
					intersector.hintElement.textContent = intersector.hintText ?? "";

					// If there are no more available hints to markup the page, don't
					// append the element.
					if (intersector.hintText) {
						applyInitialStyles(intersector);
						hintsContainer.append(intersector.hintElement);
					}
				} else if (inViewClickablePossessesHint(intersector)) {
					applyInitialStyles(intersector);
				}
			}

			if (process.env["NODE_ENV"] !== "production") {
				console.log("intersectors:", intersectors);
			}
		}, 300);
	}
}
