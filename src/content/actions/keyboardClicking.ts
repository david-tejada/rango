import browser from "webextension-polyfill";
import { retrieve } from "../../common/storage";
import { isFocusOnClickInput } from "../../typings/TypingUtils";
import { getHintsInTab } from "../utils/getHintsInTab";
import { getHintedWrappers } from "../wrappers/wrappers";

let keysPressedBuffer = "";
let timeoutId: ReturnType<typeof setTimeout>;

export function markHintsAsKeyboardReachable(letter: string) {
	const wrappers = getHintedWrappers().filter(
		(wrapper) => wrapper.hint?.string && wrapper.hint.string.startsWith(letter)
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

function isTextField(element: EventTarget | null): boolean {
	if (element && element instanceof HTMLElement) {
		return (
			isFocusOnClickInput(element) ||
			element.tagName === "TEXTAREA" ||
			element.isContentEditable
		);
	}

	return false;
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
		await browser.runtime.sendMessage({
			type: "restoreKeyboardReachableHints",
		});
		return;
	}

	// After typing the first character we need to check if any of the hints start
	// with that letter
	const firstCharactersInHints = new Set(
		getHintsInTab().map((hint) => hint.slice(0, 1))
	);

	const hintIsReachable =
		keysPressedBuffer.length === 1
			? true
			: !keysPressedBuffer && firstCharactersInHints.has(event.key);

	if (
		hintIsReachable &&
		!isTextField(event.target) &&
		/[a-z]/i.test(event.key) &&
		!modifierKeyPressed(event)
	) {
		event.preventDefault();

		// We need to check if keyboardClicking is on after event.preventDefault()
		// because if we do it after, due to the async nature of the call the default
		// behavior
		const keyboardClicking = await retrieve("keyboardClicking");

		if (!keyboardClicking) {
			return;
		}

		keysPressedBuffer += event.key;

		if (keysPressedBuffer.length === 2) {
			await browser.runtime.sendMessage({
				type: "restoreKeyboardReachableHints",
			});

			if (getHintsInTab().includes(keysPressedBuffer)) {
				await browser.runtime.sendMessage({
					type: "clickHintInFrame",
					hint: keysPressedBuffer,
				});
			}

			keysPressedBuffer = "";
		} else {
			await browser.runtime.sendMessage({
				type: "markHintsAsKeyboardReachable",
				letter: event.key,
			});

			timeoutId = setTimeout(async () => {
				await browser.runtime.sendMessage({
					type: "restoreKeyboardReachableHints",
				});
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

export function stopKeyboardClicking() {
	window.removeEventListener("keydown", keydownHandler, true);
}
