import { ElementWrapper } from "../../typings/ElementWrapper";
import { getHostPattern } from "../hints/customSelectorsStaging";

import { getCssSelector } from "css-selector-generator";

import { retrieve } from "../../common/storage";
import { store } from "../../common/storage";

import { RangoActionWithTarget } from "../../typings/RangoAction";

import { runRangoActionWithTarget } from "./runRangoActionWithTarget";
import { getWrapperForElement } from "../wrappers/wrappers";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";

// go from a unique CSS selector back to an HTML element
function getElementFromUniqueSelector(selector: string): HTMLElement | null {
	return document.querySelector(selector);
}

export async function styleSavedHints(
	fontSizeMultiplier: number = 1.5,
	scaleMultiplier: number = 1.2,
	duration: number = 3000
) {
	const hostUrlToMatch = getHostPattern();

	let hostMap = await retrieve("savedIDsByHost");

	// if the map is null then just return
	if (hostMap == null) {
		return;
	}

	let oldText = "";

	// change the elements in the map to be red, increase their size, and apply a scaling effect
	hostMap.get(hostUrlToMatch)?.forEach((value, mappedText) => {
		const element = getElementFromUniqueSelector(value);
		if (element) {
			// Get the current font size and parse it as a number
			const currentFontSize = parseFloat(
				window.getComputedStyle(element).fontSize
			);

			oldText = element.innerText;
			// Get the current transform scale value (for reverting later)
			const currentTransformScale = window.getComputedStyle(element).transform;

			// Increase the font size by multiplying it with the factor
			const newFontSize = currentFontSize * fontSizeMultiplier;

			// Set the new font size as a string with units (e.g., "px")
			element.style.fontSize = `${newFontSize}px`;

			// Apply a black outline to make the element more visible
			element.style.border = " 4px solid black";

			// Apply a scaling effect to make the element "pop" out
			element.style.transform = `scale(${scaleMultiplier})`;
			element.style.zIndex = "9999"; // Ensure it's in front of other elements (you can adjust this value)
			// Round corners and make it transparent
			element.style.borderRadius = "5px";
			element.style.opacity = "0.9";

			element.innerText = mappedText;
			// Reset the styling changes after a specified duration
			// We do want this to block since we don't want the user to
			// make changes while the styling is different
			setTimeout(() => {
				element.style.backgroundColor = ""; // Reset background color
				element.style.fontSize = ""; // Reset font size
				element.style.transform = currentTransformScale; // Reset transform scale
				element.style.zIndex = ""; // Reset zIndex
				element.style.backgroundColor = ""; // Reset background color
				element.style.border = ""; // Reset border
				element.innerText = oldText; // Reset text
			}, duration);
		} else {
			console.log(`Could not find element with selector ${value}`);
		}
	});

	// print the entire map
	function printMap(map: Map<string, string>) {
		map.forEach((value, key) => {
			console.log(`Syntactic Hint Name: ${key}, HTML Value: ${value}`);
		});
	}
	printMap(hostMap.get(hostUrlToMatch)!);
}

export async function saveUniqueHintAsWord(
	wrappers: ElementWrapper[],
	syntacticName: string
) {
	// throw an error If the length of the wrappers is less than one
	if (wrappers.length < 1) {
		throw new Error("No wrappers found");
	}

	for (const wrapper of wrappers) {
		if (wrapper.element instanceof HTMLAnchorElement) {
			const hostUrlToMatch = getHostPattern();

			let hostMap = await retrieve("savedIDsByHost");

			if (hostMap == null) {
				hostMap = new Map<string, Map<string, string>>();
			}

			//  check if the host is contained within the host map
			//  if not create a new map
			if (!hostMap.has(hostUrlToMatch)) {
				hostMap.set(hostUrlToMatch, new Map<string, string>());
			}

			const uniqueSelector = getCssSelector(wrapper.element);
			//  if we cannot get a unique selector then just  continue the loop
			if (uniqueSelector == null) {
				console.log("Could not get a unique selector");
				continue;
			}
			// Set the value for the syntactic name equal to the unique element selector
			hostMap.get(hostUrlToMatch)?.set(syntacticName, uniqueSelector);
			await store("savedIDsByHost", hostMap);
		}
	}
	await styleSavedHints();
}

async function getMapForCurrentURL() {
	const hostUrlToMatch = getHostPattern();

	let hostMap = await retrieve("savedIDsByHost");

	// if the map is null then just return
	if (hostMap == null) {
		return;
	}

	//  we know it can't be undefined
	return hostMap.get(hostUrlToMatch) as Map<string, string>;
}

export async function rangoActionOnSavedID(actionAndTargetName: string) {
	// split the string based on the % character
	//  since in order to preserve the current syntax
	//  we can only pass in one argument
	const [action, targetName] = actionAndTargetName.split("%");
	// If the split failed then just return
	if (targetName == null || action == null) {
		console.log("Could not split the string");
		return;
	}
	console.log(`Performing Action: ${action} on Target: ${targetName}`);

	// Since we are getting an action in from the user
	//  I'm not sure if there's a better way to do type validation here
	const rangoActionFromActionString = {
		type: action,
	} as unknown as RangoActionWithTarget;

	const validTargets = await getMapForCurrentURL();
	if (validTargets == null) {
		return;
	}
	if (!validTargets.has(targetName)) {
		return;
	}
	const uniqueSelector = validTargets.get(targetName);
	const element = getElementFromUniqueSelector(uniqueSelector!);

	if (element) {
		const wrapperToScriptOn: ElementWrapper = getOrCreateWrapper(element);

		runRangoActionWithTarget(rangoActionFromActionString, [wrapperToScriptOn]);
	}
}
