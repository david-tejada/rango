import { throttle } from "lodash";

interface RefreshHintsOptions {
	throttle?: boolean;
	position?: boolean;
	style?: boolean;
	clearCustomMarks?: boolean;
}

function refreshHintsLogic(options?: RefreshHintsOptions) {
	if (clearCustomMarks) {
	}
}

export function refreshHints(options?: RefreshHintsOptions) {
	const functionToCall = options?.throttle
		? throttle(refreshHintsLogic, 50)
		: refreshHintsLogic;

	functionToCall(options);
}
