import { ResponseToTalon } from "../../typings/RequestFromTalon";

export const noActionResponse: ResponseToTalon = {
	type: "response",
	action: {
		type: "noAction",
	},
};
