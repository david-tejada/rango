import { sendMessage } from "../messaging/contentMessageBroker";
import { notify } from "../notify/notify";
import { onSettingChange } from "../settings/settingsManager";
import { getActiveElement, isEditable } from "../utils/domUtils";
import { refresh } from "../wrappers/refresh";
import { getHintedWrappers } from "../wrappers/wrappers";

let keysPressedBuffer = "";
let timeoutId: ReturnType<typeof setTimeout>;

export function markHintsAsKeyboardReachable(letter: string) {
	const wrappers = getHintedWrappers().filter((wrapper) =>
		wrapper.hint?.string?.startsWith(letter)
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

	const hintsInTab = await sendMessage("getHintsInTab");

	// After typing the first character we need to check if any of the hints start
	// with that letter
	const firstCharactersInHints = new Set(
		hintsInTab.map((hint) => hint.slice(0, 1))
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

			if (hintsInTab.includes(keysPressedBuffer)) {
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
	window.addEventListener("keydown", keydownHandler, true);
}

function stopKeyboardClicking() {
	window.removeEventListener("keydown", keydownHandler, true);
}

onSettingChange("keyboardClicking", async (keyboardClicking) => {
	if (keyboardClicking) {
		initKeyboardClicking();
	} else {
		stopKeyboardClicking();
	}

	const status = keyboardClicking ? "enabled" : "disabled";

	await notify(`Keyboard clicking ${status}`, {
		icon: status,
		toastId: "keyboardToggle",
	});

	await refresh({ hintsCharacters: true });
});
