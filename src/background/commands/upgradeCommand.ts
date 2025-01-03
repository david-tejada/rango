import { getTargetFromLabels } from "../../common/target/targetConversion";
import {
	type ActionMap,
	type ActionV1,
	type ActionV2,
	type ActionWithElementTarget,
	type LocationProperty,
	type ToggleLevel,
} from "../../typings/Action";
import { type Command, type CommandV2 } from "../../typings/Command";
import { type Direction } from "../../typings/Direction";
import { getTargetFromTabMarkers } from "../target/tabMarkers";

function upgradeAction(action: ActionV1): ActionV2<keyof ActionMap> {
	const { type: name, target, ...rest } = action;

	const { arg, arg2, arg3 } = rest;

	switch (name) {
		case "closeNextTabsInWindow":
		case "closePreviousTabsInWindow":
		case "closeTabsLeftEndInWindow":
		case "closeTabsRightEndInWindow": {
			return { name, amount: arg as number };
		}

		case "cycleTabsByText": {
			return { name, step: arg as number };
		}

		case "focusTabByText": {
			return { name, text: arg as string };
		}

		case "openPageInNewTab":
		case "focusOrCreateTabByUrl": {
			return { name, url: arg as string };
		}

		case "activateTab":
		case "closeTab":
		case "muteTab":
		case "unmuteTab": {
			return {
				name,
				target: target ? getTargetFromTabMarkers(target) : undefined,
			};
		}

		case "copyLocationProperty": {
			return { name, property: arg as LocationProperty };
		}

		case "runActionOnReference": {
			return {
				name: arg as ActionWithElementTarget,
				target: {
					type: "primitive",
					mark: { type: "elementReference", value: arg2! },
				},
			};
		}

		case "runActionOnTextMatchedElement": {
			return {
				name: arg as ActionWithElementTarget,
				target: {
					type: "primitive",
					mark: {
						type: "fuzzyText",
						value: arg2!,
						// There was a bug in rango-talon where this was not set if it was false
						viewportOnly: arg3 ?? false,
					},
				},
			};
		}

		case "scrollDownAtElement":
		case "scrollUpAtElement":
		case "scrollLeftAtElement":
		case "scrollRightAtElement": {
			if (!target) {
				return {
					name: "scroll",
					region: "repeatLast",
					direction: extractWordFromCamelCase(name, 1) as Direction,
					factor: arg as number,
				};
			}

			return {
				name: "scrollAtElement",
				target: getTargetFromLabels(target),
				direction: extractWordFromCamelCase(name, 1) as Direction,
				factor: arg as number,
			};
		}

		case "scrollDownPage":
		case "scrollUpPage":
		case "scrollLeftPage":
		case "scrollRightPage": {
			return {
				name: "scroll",
				region: "main",
				direction: extractWordFromCamelCase(name, 1) as Direction,
				factor: arg as number,
			};
		}

		case "scrollDownLeftAside":
		case "scrollUpLeftAside": {
			return {
				name: "scroll",
				region: "leftSidebar",
				direction: extractWordFromCamelCase(name, 1) as Direction,
				factor: arg as number,
			};
		}

		case "scrollDownRightAside":
		case "scrollUpRightAside": {
			return {
				name: "scroll",
				region: "rightSidebar",
				direction: extractWordFromCamelCase(name, 1) as Direction,
				factor: arg as number,
			};
		}

		case "scrollElementToTop":
		case "scrollElementToCenter":
		case "scrollElementToBottom": {
			return {
				name: "snapScroll",
				target: getTargetFromLabels(target!),
				position: extractWordFromCamelCase(name, 3) as
					| "top"
					| "center"
					| "bottom",
			};
		}

		case "storeScrollPosition":
		case "scrollToPosition": {
			return {
				name,
				positionName: arg as string,
			};
		}

		case "disableHints":
		case "enableHints":
		case "resetToggleLevel": {
			return {
				name,
				level: arg as ToggleLevel,
			};
		}

		case "saveReference": {
			return {
				name,
				target: target ? getTargetFromLabels(target) : undefined,
				referenceName: arg as string,
			};
		}

		case "removeReference":
		case "saveReferenceForActiveElement": {
			return {
				name,
				referenceName: arg as string,
			};
		}

		default: {
			return {
				name,
				target: target ? getTargetFromLabels(target) : undefined,
				...rest,
			};
		}
	}
}

export function upgradeCommand(command: Command): CommandV2<keyof ActionMap> {
	if (command.version === 2) return command;

	if (command.version === 1) {
		return {
			...command,
			version: 2,
			action: upgradeAction(command.action),
		};
	}

	return command;
}

function extractWordFromCamelCase(name: string, index: number): string {
	const words = name.split(/(?=[A-Z])/);
	const extractedWord = words[index];

	if (!extractedWord) {
		throw new Error(`Could not extract word from camel case string: ${name}`);
	}

	return extractedWord.toLowerCase();
}
