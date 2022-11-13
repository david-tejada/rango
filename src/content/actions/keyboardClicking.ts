import browser from "webextension-polyfill";
import { assertDefined, isFocusOnClickInput } from "../../typings/TypingUtils";
import { getHintsInTab } from "../utils/getHintsInTab";
import { getWrapper } from "../wrappers";

let keysPressedBuffer = "";
let timeoutId: ReturnType<typeof setTimeout>;

export function markHintsAsKeyboardReachable(letter: string) {
	const hintElements: NodeListOf<HTMLDivElement> =
		document.querySelectorAll(".rango-hint");
	const hintsToHighlight = [...hintElements].filter((hintElement) =>
		hintElement.textContent?.startsWith(letter)
	);
	for (const hintElement of hintsToHighlight) {
		assertDefined(hintElement.textContent);
		const wrapper = getWrapper(hintElement.textContent);
		wrapper.hint?.emphasize();
	}
}

export function restoreKeyboardReachableHints() {
	const hintElements = document.querySelectorAll(".rango-hint");

	for (const hintElement of hintElements) {
		if (hintElement.textContent) {
			const wrapper = getWrapper(hintElement.textContent);
			wrapper?.hint?.applyDefaultStyle();
		}
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

	// After typing the first character we need to check if any of the hints start with that letter
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
		const { keyboardClicking } = await browser.storage.local.get(
			"keyboardClicking"
		);
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

export async function initKeyboardClicking() {
	window.addEventListener("keydown", keydownHandler, true);
}
