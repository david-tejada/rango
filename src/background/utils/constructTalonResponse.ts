import {
	ResponseToTalon,
	TalonAction,
	TalonActionLegacy,
} from "../../typings/RequestFromTalon";

type PropType<TObject, TProp extends keyof TObject> = TObject[TProp];

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
			type:
				mainAction.previousName ??
				(mainAction.name as PropType<TalonActionLegacy, "type">),
			key: mainAction.key,
			textToCopy: mainAction.textToCopy,
		};
	} else {
		legacyAction = { type: "noAction" };
	}

	return {
		type: "response",
		action: legacyAction,
		actions,
	};
}
