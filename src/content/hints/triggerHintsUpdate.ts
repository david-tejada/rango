import { Intersector, HintedIntersector } from "../../typings/Intersector";
import {
	assertDefined,
	isHintedIntersector,
	isNotNull,
} from "../../typings/TypingUtils";
import { elementIsVisible } from "../utils/elementIsVisible";
import { cacheHintOptions } from "../options/cacheHintOptions";
import { intersectors, removedIntersectorsHints } from "../intersectors";
import { getHintsInTab } from "../utils/getHintsInTab";
import { positionHint } from "./positionHint";
import { applyInitialStyles } from "./applyInitialStyles";
import {
	initStack,
	claimHints,
	releaseHints,
	releaseOrphanHints,
} from "./hintsRequests";
import { shouldDisplayHints } from "./shouldDisplayHints";
import { shouldDisplayHint, shouldPositionHint } from "./shouldDisplayHint";

let hintsWillUpdate = false;
let hintsAreUpdating = false;

function hiddenClickableNeedsRemoved(intersector: Intersector): boolean {
	return (
		intersector.clickableType !== undefined &&
		intersector.hintText !== undefined &&
		!elementIsVisible(intersector)
	);
}

function disabledClickableNeedsRemoved(intersector: Intersector): boolean {
	return (
		intersector.clickableType === "disabled" &&
		intersector.hintText !== undefined
	);
}

function inViewClickableMissingHint(intersector: Intersector): boolean {
	return (
		intersector.clickableType !== undefined &&
		intersector.clickableType !== "disabled" &&
		intersector.hintText === undefined &&
		elementIsVisible(intersector)
	);
}

function inViewClickablePossessesHint(intersector: Intersector): boolean {
	return (
		intersector.clickableType !== undefined &&
		intersector.clickableType !== "disabled" &&
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
		if (
			hiddenClickableNeedsRemoved(intersector) ||
			disabledClickableNeedsRemoved(intersector)
		) {
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

	for (const intersector of toBeRemoved) {
		intersector.hintElement?.remove();
		intersector.hintElement = undefined;
		intersector.hintText = undefined;
	}

	// Extra check to make sure all hints in intersectors are already claimed so
	// that no duplicate hints are assigned
	const hintsInTab = new Set(getHintsInTab());
	const intersectorsWithUnclaimedHints = intersectors.filter(
		(intersector) =>
			intersector.hintText && !hintsInTab.has(intersector.hintText)
	);
	for (const intersector of intersectorsWithUnclaimedHints) {
		intersector.hintElement?.remove();
		intersector.hintElement = undefined;
		intersector.hintText = undefined;
		toAddHint.push(intersector);
	}

	const claimedHints = await claimHints(toAddHint.length);

	for (const intersector of toAddHint) {
		if (shouldDisplayHint(intersector)) {
			intersector.hintElement = document.createElement("div");
			intersector.hintElement.style.display = "none";
			intersector.hintText = claimedHints.pop();
			intersector.hintElement.textContent = intersector.hintText ?? "";
		}

		// If there are no more available hints to markup the page, don't
		// append the element.
		if (isHintedIntersector(intersector)) {
			applyInitialStyles(intersector);
			hintsContainer.append(intersector.hintElement);
			if (shouldPositionHint(intersector)) {
				positionHint(intersector);
			}
		}
	}

	for (const intersector of toRefresh) {
		if (shouldDisplayHint(intersector)) {
			applyInitialStyles(intersector);
		} else {
			intersector.hintElement.style.display = "none";
		}

		if (shouldPositionHint(intersector)) {
			positionHint(intersector);
		}
	}

	// Hints cleanup
	const hintElements: NodeListOf<HTMLDivElement> =
		hintsContainer.querySelectorAll(".rango-hint");
	const hintTexts = intersectors
		.filter(isHintedIntersector)
		.map((intersector) => intersector.hintText);
	const hintsSet = new Set(hintTexts);
	for (const hintElement of hintElements) {
		assertDefined(hintElement.textContent);
		if (!hintsSet.has(hintElement.textContent)) {
			hintElement.remove();
		}
	}

	await releaseOrphanHints(hintTexts);

	// I don't know why it happens but after the hints update some intersectors end up
	// with the same hint, so if that happens we just make a full hints refresh
	const hintsInUse = [...hintsContainer.querySelectorAll(".rango-hint")]
		.map((hintElement) => hintElement.textContent)
		.filter(isNotNull);
	const firstDuplicatedHint = hintsInUse.find(
		(item, index) => hintsInUse.indexOf(item) !== index
	);

	if (firstDuplicatedHint) {
		await triggerHintsUpdate(true);
	}

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
