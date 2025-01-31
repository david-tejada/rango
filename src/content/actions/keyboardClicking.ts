import { getActiveElement, isEditable } from "../dom/utils";
import { onDocumentVisible } from "../dom/whenVisible";
import { notify } from "../feedback/notify";
import { sendMessage } from "../messaging/messageHandler";
import { settingsSync } from "../settings/settingsSync";
import { getHintedWrappers } from "../wrappers/wrappers";

let keysPressedBuffer = "";
let timeoutId: ReturnType<typeof setTimeout>;

export function markHintsAsKeyboardReachable(letter: string) {
	const wrappers = getHintedWrappers().filter((wrapper) =>
		wrapper.hint?.label?.startsWith(letter)
	);
	for (const wrapper of wrappers) {
		wrapper?.hint?.keyHighlight();
	}
}

export function restoreKeyboardReachableHints() {
	const wrappers = getHintedWrappers();

	for (const wrapper of wrappers) {
		wrapper.hint?.clearKeyHighlight();
	}
}

function modifierKeyPressed(event: KeyboardEvent): boolean {
	return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

async function keydownHandler(event: KeyboardEvent) {
	// We need to clear the interval initiated after typing the first character
	// in case typing the second character doesn't result in a navigation
	clearInterval(timeoutId);

	// If the user types one character and then changes its mind, they can use
	// Escape or any non alphabetic key to restart the buffer
	if (keysPressedBuffer.length === 1 && !/^[A-Za-z]$/.test(event.key)) {
		keysPressedBuffer = "";
		await sendMessage("restoreKeyboardReachableHints");
		return;
	}

	const labelsInViewport = await sendMessage("getLabelsInViewport");

	// After typing the first character we need to check if any of the hints start
	// with that letter
	const firstCharactersInHints = new Set(
		labelsInViewport.map((hint) => hint.slice(0, 1))
	);

	const hintIsReachable =
		keysPressedBuffer.length === 1
			? true
			: !keysPressedBuffer && firstCharactersInHints.has(event.key);

	if (
		hintIsReachable &&
		!isEditable(getActiveElement()) &&
		/[a-z]/i.test(event.key) &&
		!modifierKeyPressed(event)
	) {
		event.preventDefault();
		event.stopImmediatePropagation();

		keysPressedBuffer += event.key;

		if (keysPressedBuffer.length === 2) {
			await sendMessage("restoreKeyboardReachableHints");

			if (labelsInViewport.includes(keysPressedBuffer)) {
				await sendMessage("clickHintInFrame", {
					hint: keysPressedBuffer,
				});
			}

			keysPressedBuffer = "";
		} else {
			await sendMessage("markHintsAsKeyboardReachable", {
				letter: event.key,
			});

			timeoutId = setTimeout(async () => {
				await sendMessage("restoreKeyboardReachableHints");
				keysPressedBuffer = "";
			}, 3000);
		}
	} else {
		keysPressedBuffer = "";
	}
}

export function initKeyboardClicking() {
	addEventListener("keydown", keydownHandler, true);
}

function stopKeyboardClicking() {
	removeEventListener("keydown", keydownHandler, true);
}

async function handleKeyboardClickingChange(keyboardClicking: boolean) {
	if (keyboardClicking) {
		initKeyboardClicking();
	} else {
		stopKeyboardClicking();
	}
}

settingsSync.onChange("keyboardClicking", async (keyboardClicking) => {
	onDocumentVisible(handleKeyboardClickingChange, keyboardClicking);

	const status = keyboardClicking ? "enabled" : "disabled";
	await notify[status](`Keyboard clicking ${status}`, "keyboardToggle");
});
