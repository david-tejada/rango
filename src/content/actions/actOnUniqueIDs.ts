import { ElementWrapper } from "../../typings/ElementWrapper";
import { getHostPattern } from "../hints/customSelectorsStaging";

import { getCssSelector } from "css-selector-generator";

import { retrieve } from "../../common/storage";
import { store } from "../../common/storage";

// go from a unique CSS selector back to an HTML element
function getElementFromUniqueSelector(selector: string): HTMLElement | null {
	return document.querySelector(selector);
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
			//  check if the host is contained within the host map
			//  if not create a new map
			if (!hostMap.has(hostUrlToMatch)) {
				hostMap.set(hostUrlToMatch, new Map<string, string>());
			}

			const uniqueSelector = getCssSelector(wrapper.element);
			console.log(`Unique selector is = ${uniqueSelector}`);
			//  if we cannot get a unique selector then just  continue the loop
			if (uniqueSelector == null) {
				console.log("Could not get a unique selector");
				continue;
			}
			// Set the value for the syntactic name equal to the unique element selector
			hostMap.get(hostUrlToMatch)?.set(syntacticName, uniqueSelector);
			// print out all the values in the map
			console.log(`Map is ${hostMap}`);
			await store("savedIDsByHost", hostMap);
			console.log(`Saved as ${hostMap}`);
		}
	}
}
