import { Command } from "../types/types";
import { sendCommandToAllTabs } from "./tabs-messaging";

async function toggleHintsInAllTabs() {
	try {
		await sendCommandToAllTabs({ type: "toggleHints" });
	} catch (error: unknown) {
		let errorMessage = "Error: There was an error";
		if (error instanceof Error) {
			errorMessage = error.message;
		}

		console.error(errorMessage);
	}
}

export async function executeBackgroundCommand(command: Command) {
	switch (command.type) {
		case "toggleHints":
			await toggleHintsInAllTabs();
			break;
		default:
			break;
	}
}
