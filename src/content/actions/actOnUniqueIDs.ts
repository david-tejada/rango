import { ElementWrapper } from "../../typings/ElementWrapper";
import { getHostPattern } from "../hints/customSelectorsStaging";

import { getCssSelector } from "css-selector-generator";

import { retrieve } from "../../common/storage";
import { store } from "../../common/storage";

import { RangoActionWithTarget } from "../../typings/RangoAction";

import { runRangoActionWithTarget } from "./runRangoActionWithTarget";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { notify } from "../notify/notify";
import { showTooltip } from "../hints/showTooltip";

// go from a unique CSS selector back to an HTML element
function getElementFromUniqueSelector(selector: string): HTMLElement | null {
	return document.querySelector(selector);
}

export async function showMarks(duration: number = 2000) {
	const validTargets = await getMapForCurrentURL();
	if (validTargets == null) {
		await notify(`You do not have any marks saved in this context`, {
			type: "error",
		});
		return;
	}
	validTargets.forEach((value, mappedText) => {
		const element = getElementFromUniqueSelector(value);
		if (element) {
			const tooltipWrapper: ElementWrapper = getOrCreateWrapper(element);
			showTooltip(tooltipWrapper, mappedText, duration);
		}
	});
}
export async function removeSavedID(syntacticName: string) {
	const map = await getMapForCurrentURL();
	if (map == null) {
		await notify(`You do not have any marks saved in this context`, {
			type: "error",
		});
		return;
	}
	if (!map.has(syntacticName)) {
		await notify(`${syntacticName} is not saved in the current context`, {
			type: "error",
		});
		return;
	}
	map.delete(syntacticName);
	const hostMap = await retrieve("savedIDsByHost")!;

	hostMap.set(getHostPattern(), map);

	await store("savedIDsByHost", hostMap);
	await notify(`Removed "${syntacticName}" from saved IDs`, {
		type: "success",
	});
	await showMarks();
}

export async function saveUniqueHintAsMark(
	wrappers: ElementWrapper[],
	syntacticName: string
) {
	for (const wrapper of wrappers) {
		if (wrapper.element instanceof HTMLAnchorElement) {
			const hostUrlToMatch = getHostPattern();

			let hostMap = await retrieve("savedIDsByHost");

			if (hostMap == null) {
				hostMap = new Map<string, Map<string, string>>();
			}

			if (!hostMap.has(hostUrlToMatch)) {
				hostMap.set(hostUrlToMatch, new Map<string, string>());
			}

			const uniqueSelector = getCssSelector(wrapper.element);
			if (uniqueSelector == null) {
				await notify("Could not get a unique selector the element", {
					type: "error",
				});
				continue;
			}
			hostMap.get(hostUrlToMatch)?.set(syntacticName, uniqueSelector);
			await store("savedIDsByHost", hostMap);
		}
	}
	await showMarks();
}

async function getMapForCurrentURL() {
	const hostUrlToMatch = getHostPattern();

	let hostMap = await retrieve("savedIDsByHost");

	if (hostMap == null) {
		return;
	}

	return hostMap.get(hostUrlToMatch) as Map<string, string>;
}

export async function rangoActionOnSavedID(actionAndTargetName: string) {
	// split the string based on the % character
	//  since in order to preserve the current syntax
	//  we can only pass in one argument
	let [action, savedMarkToActOn] = actionAndTargetName.split("%");

	// If the split failed then just return
	if (savedMarkToActOn == null || action == null) {
		await notify(
			`Could not get a valid action from the string ${actionAndTargetName}`,
			{
				type: "error",
			}
		);
		return;
	}

	try {
		action = action as RangoActionWithTarget["type"];
	} catch {
		await notify(`Action: ${action} is not a valid action`, {
			type: "error",
		});
		return;
	}

	// Since we are getting an action in from the user
	//  I'm not sure if there's a better way to do type validation here
	const rangoActionFromActionString = {
		type: action,
		// empty target since we pass in the wrapper
		// which is the element we want to perform the action on
		target: [],
		// any args passed to the rango action
		arg: savedMarkToActOn,
	} as RangoActionWithTarget;

	const validTargets = await getMapForCurrentURL();
	if (validTargets == null) {
		await notify(`You do not have any marks saved in this context`, {
			type: "error",
		});
		return;
	}
	if (!validTargets.has(savedMarkToActOn)) {
		await notify(
			`Mark "${savedMarkToActOn}" is not saved in the current context`,
			{
				type: "error",
			}
		);
		return;
	}

	const uniqueSelector = validTargets.get(savedMarkToActOn);
	const element = getElementFromUniqueSelector(uniqueSelector!);

	if (element) {
		const wrapperToScriptOn: ElementWrapper = getOrCreateWrapper(element);
		console.log(
			`Performing Action: "${action}" on saved mark name: "${savedMarkToActOn}"`
		);

		// TODO: wait for hints to be loaded before running this
		runRangoActionWithTarget(rangoActionFromActionString, [wrapperToScriptOn]);
	} else {
		await notify(`Could not find element with selector ${uniqueSelector}`, {
			type: "error",
		});
	}
}
