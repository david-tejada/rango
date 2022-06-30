import { Intersector, HintedIntersector } from "../../typing/types";
import { assertDefined, isHintedIntersector } from "../../typing/typing-utils";
import { elementIsVisible } from "../utils/element-visibility";
import { cacheHintOptions } from "../options/hint-style-options";
import { intersectors, removedIntersectorsHints } from "../intersectors";
import { positionHint } from "./position-hints";
import { applyInitialStyles } from "./styles";
import {
	initStack,
	claimHints,
	releaseHints,
	releaseOrphanHints,
} from "./hints-requests";
import { shouldDisplayHints } from "./should-display-hints";

let hintsWillUpdate = false;
let hintsAreUpdating = false;

function hiddenClickableNeedsRemoved(intersector: Intersector): boolean {
	return (
		intersector.clickableType !== undefined &&
		intersector.hintText !== undefined &&
		!elementIsVisible(intersector)
	);
}

function inViewClickableMissingHint(intersector: Intersector): boolean {
	return (
		intersector.clickableType !== undefined &&
		intersector.hintText === undefined &&
		elementIsVisible(intersector)
	);
}

function inViewClickablePossessesHint(intersector: Intersector): boolean {
	return (
		intersector.clickableType !== undefined &&
		intersector.hintText !== undefined &&
		elementIsVisible(intersector)
	);
}

function getHintsContainer(): HTMLDivElement | undefined {
	// This addresses issue #20 where the hint text would get sent on submit
	if (document.body.contentEditable === "true") {
		return undefined;
	}

	let container = document.querySelector("#rango-hints-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "rango-hints-container";
		document.body.append(container);
	}

	return container as HTMLDivElement;
}

async function updateHints() {
	hintsAreUpdating = true;
	const hintsContainer = getHintsContainer();

	if (!hintsContainer) {
		return;
	}

	const toBeRemoved: Intersector[] = [];
	const toAddHint: Intersector[] = [];
	const toRefresh: HintedIntersector[] = [];

	for (const intersector of intersectors) {
		if (hiddenClickableNeedsRemoved(intersector)) {
			toBeRemoved.push(intersector);
		} else if (inViewClickableMissingHint(intersector)) {
			toAddHint.push(intersector);
		} else if (
			isHintedIntersector(intersector) &&
			inViewClickablePossessesHint(intersector)
		) {
			toRefresh.push(intersector);
		}
	}

	const hintsToRelease = toBeRemoved.map((intersector) => intersector.hintText);
	await releaseHints([
		...hintsToRelease,
		...removedIntersectorsHints,
	] as string[]);
	removedIntersectorsHints.clear();

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
		if (isHintedIntersector(intersector)) {
			applyInitialStyles(intersector);
			hintsContainer.append(intersector.hintElement);
			positionHint(intersector);
		}
	}

	for (const intersector of toRefresh) {
		applyInitialStyles(intersector);
		positionHint(intersector);
	}

	// Hints cleanup
	const hintElements = hintsContainer.querySelectorAll(".rango-hint");
	const hintTexts = intersectors
		.filter(isHintedIntersector) // eslint-disable-line unicorn/no-array-callback-reference
		.map((intersector) => intersector.hintText);
	const hintsSet = new Set(hintTexts);
	for (const hintElement of hintElements) {
		assertDefined(hintElement.textContent);
		if (!hintsSet.has(hintElement.textContent)) {
			hintElement.remove();
		}
	}

	await releaseOrphanHints(hintTexts);

	if (process.env["NODE_ENV"] !== "production") {
		const hintedIntersectors = intersectors
			.filter((intersector) => intersector.hintText)
			.sort(
				(a, b) =>
					a.hintText!.length - b.hintText!.length ||
					a.hintText!.localeCompare(b.hintText!)
			)
			.map((intersector) => ({
				hint: intersector.hintText,
				element: intersector.element,
			}));
		console.log("intersectors:", intersectors);
		console.log("hinted intersectors:", hintedIntersectors);
	}

	hintsAreUpdating = false;
	hintsWillUpdate = false;
}

export async function triggerHintsUpdate(fullRefresh = false) {
	if (fullRefresh) {
		await cacheHintOptions();
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
	const showHints = await shouldDisplayHints();
	if (showHints && hintsAreUpdating) {
		setTimeout(triggerHintsUpdate, 300);
	}

	if (showHints && !hintsWillUpdate && !hintsAreUpdating) {
		hintsWillUpdate = true;
		setTimeout(updateHints, 50);
	}
}
