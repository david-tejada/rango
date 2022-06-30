import Color from "color";
import browser from "webextension-polyfill";
import {
	assertDefined,
	isFocusOnClickInput,
	isHintedIntersector,
} from "../typing/typing-utils";
import { applyInitialStyles } from "./hints/styles";
import { getIntersectorWithHint } from "./intersectors";

let keysPressedBuffer = "";
let hintsInTab: string[] = [];
let timeoutId: ReturnType<typeof setTimeout>;

export function updateHintsInTab(hints: string[]) {
	hintsInTab = hints;
}

export function markHintsAsKeyboardReachable(letter: string) {
	const hintElements = document.querySelectorAll(".rango-hint");
	const hintsToHighlight = [...hintElements].filter((hintElement) =>
		hintElement.textContent?.startsWith(letter)
	);
	for (const hintElement of hintsToHighlight) {
		assertDefined(hintElement.textContent);
		const intersector = getIntersectorWithHint(hintElement.textContent);
		if (hintElement instanceof HTMLDivElement) {
			intersector.freezeHintStyle = true;
			hintElement.style.fontWeight = "bold";
			hintElement.style.outlineWidth = "2px";
			hintElement.style.outlineColor = new Color(hintElement.style.outlineColor)
				.alpha(0.7)
				.string();
		}
	}
}

export function restoreKeyboardReachableHints() {
	const hintElements = document.querySelectorAll(".rango-hint");

	for (const hintElement of hintElements) {
		assertDefined(hintElement.textContent);
		const intersector = getIntersectorWithHint(hintElement.textContent);
		intersector.freezeHintStyle = false;
		if (isHintedIntersector(intersector)) {
			applyInitialStyles(intersector);
		}
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
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

	// If the user types one character and then changes its mind, they can use Escape
	// to restart the buffer
	if (keysPressedBuffer.length === 1 && event.key === "Escape") {
		keysPressedBuffer = "";
		await browser.runtime.sendMessage({
			type: "restoreKeyboardReachableHints",
		});
		return;
	}

	// After typing the first character we need to check if any of the hints start with that letter
	const firstCharactersInHints = new Set(
		hintsInTab.map((hint) => hint.slice(0, 1))
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

			if (hintsInTab.includes(keysPressedBuffer)) {
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

export async function initKeyboardNavigation() {
	window.addEventListener("keydown", keydownHandler, true);
}
