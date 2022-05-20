import browser from "webextension-polyfill";
import { Intersector } from "../types/types";
import { elementIsObscured } from "../lib/dom-utils";
import { applyInitialStyles } from "../lib/styles";
import { getOption } from "../lib/options";
import { claimHints, releaseHints, initStack } from "./hints-allocator";
import { intersectors, removedIntersectorsHints } from "./intersectors";

let hintsAreUpdating = false;
let updateHintsTimeout: NodeJS.Timeout;

browser.storage.onChanged.addListener(async (changes) => {
	console.log("changes:", changes);
	if ("showHints" in changes) {
		console.log("This was called");
		await triggerHintsUpdate(true);
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

function getHintsContainer(): HTMLElement {
	let container = document.querySelector("#rango-hints-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "rango-hints-container";
		document.body.append(container);
	}

	return container as HTMLElement;
}

async function updateHints() {
	hintsAreUpdating = true;
	console.log("Drawing hints");
	console.trace();
	const hintsContainer = getHintsContainer();

	const toBeRemoved: Intersector[] = [];
	const toAddHint: Intersector[] = [];
	const toRefresh: Intersector[] = [];

	for (const intersector of intersectors) {
		if (hiddenClickableNeedsRemoved(intersector)) {
			toBeRemoved.push(intersector);
		} else if (inViewClickableMissingHint(intersector)) {
			toAddHint.push(intersector);
		} else if (inViewClickablePossessesHint(intersector)) {
			toRefresh.push(intersector);
		}
	}

	console.log("toBeRemoved:", toBeRemoved);
	console.log("toAddHint:", toAddHint);
	console.log("toRefresh:", toRefresh);

	const hintsToRelease = toBeRemoved.map((intersector) => intersector.hintText);
	console.log("hintsToRelease:", [
		...hintsToRelease,
		...removedIntersectorsHints,
	]);
	await releaseHints([
		...hintsToRelease,
		...removedIntersectorsHints,
	] as string[]);
	removedIntersectorsHints.clear();

	console.log(`Claiming ${toAddHint.length} hints`);
	const claimedHints = await claimHints(toAddHint.length);

	for (const intersector of toBeRemoved) {
		intersector.hintElement?.remove();
		intersector.hintElement = undefined;
		intersector.hintText = undefined;
	}

	for (const intersector of toAddHint) {
		intersector.hintElement = document.createElement("div");
		intersector.hintText = claimedHints.pop();
		intersector.hintElement.textContent = intersector.hintText ?? "";

		// If there are no more available hints to markup the page, don't
		// append the element.
		if (intersector.hintText) {
			applyInitialStyles(intersector).catch((error) => {
				console.error(error);
			});
			hintsContainer.append(intersector.hintElement as Node);
		}
	}

	for (const intersector of toRefresh) {
		applyInitialStyles(intersector).catch((error) => {
			console.error(error);
		});
	}

	if (process.env["NODE_ENV"] !== "production") {
		const hints = intersectors
			.filter((intersector) => intersector.hintText)
			.sort(
				(a, b) =>
					a.hintText!.length - b.hintText!.length ||
					a.hintText!.localeCompare(b.hintText!)
			);
		console.log("intersectors:", intersectors);
		console.log("hints:", hints);
	}

	console.log("Drawing hints finished");
	hintsAreUpdating = false;
}

export async function triggerHintsUpdate(fullRefresh = false) {
	if (fullRefresh) {
		document.querySelector("#rango-hints-container")?.remove();
		await initStack();
		for (const intersector of intersectors) {
			intersector.hintElement?.remove();
			intersector.hintElement = undefined;
			intersector.hintText = undefined;
		}
	}

	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	const showHints = getOption("showHints");
	if (showHints && !hintsAreUpdating) {
		clearTimeout(updateHintsTimeout);
		updateHintsTimeout = setTimeout(updateHints, 200);
	}
}
