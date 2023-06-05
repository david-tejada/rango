import {
	ResponseToTalon,
	TalonAction,
	TalonActionLegacy,
} from "../../typings/RequestFromTalon";

export function constructTalonResponse(
	actions: TalonAction[]
): ResponseToTalon {
	for (const action of actions) {
		if (action.name === "typeTargetCharacters") {
			action.previousName = "noHintFound";
		}
	}

	let mainAction: TalonAction | undefined;
	let legacyAction: TalonActionLegacy | undefined;

	if (actions.length === 1) {
		mainAction = actions[0]!;
	}

	if (actions.length > 1) {
		mainAction = actions.find((action) => action.main);
	}

	if (mainAction) {
		legacyAction = {
			type: ("previousName" in mainAction
				? mainAction.previousName
				: mainAction.name) as TalonActionLegacy["type"],
		};
		if ("key" in mainAction) legacyAction.key = mainAction.key;
		if ("textToCopy" in mainAction) legacyAction.key = mainAction.textToCopy;
	} else {
		legacyAction = { type: "noAction" };
	}

	return {
		type: "response",
		action: legacyAction,
		actions,
	};
}
