import * as browser from "webextension-polyfill";
import getVisibleClickableElements from "./clickable-elements";

window.addEventListener("load", main, false);
let visibleClickableElements;
function main() {
	console.log("Hello world!!");
	let choices = [];

	// Sending a message is always done to your extension or to a different extension.
	// So we send a message to an event listener on a background script.
	(async () => {
		try {
			visibleClickableElements = getVisibleClickableElements();
			const response = (await browser.runtime.sendMessage(
				"** Message from content **"
			)) as string;
			console.log(`Response: ${response}`);
		} catch (error: unknown) {
			console.log(error);
		}
	})();

	browser.runtime.onMessage.addListener(async (request) => {
		if (request.action.type === "click") {
			const target = request.action.target as string;
			console.log("visibleClickableElements:");
			console.log(visibleClickableElements);

			const matches = Array.from(visibleClickableElements).filter((a) => {
				return a.textContent!.toLowerCase().includes(target.toLowerCase());
			}) as HTMLElement[];

			if (matches.length > 1) {
				choices = matches.map((match, index) => {
					const rect = match.getBoundingClientRect();
					const coordinates = {
						left: rect.left,
						top: rect.top,
					};
					return {
						element: match,
						index,
						coordinates,
					};
				});
				console.log("options:");
				console.log(choices);

				const marksContainer = document.createElement("div");
				marksContainer.id = "marks-container";

				for (const option of choices) {
					const hint = document.createElement("div");
					const styles = {
						zIndex: "99999",
						position: "fixed",
						background: "#333",
						borderRadius: "10%",
						color: "#fff",
						padding: "6px",
						width: "auto",
						height: "auto",
						lineHeight: "14px",
						fontFamily: "monospace",
						left: `${option.coordinates.left}px`,
						top: `${option.coordinates.top}px`,
					};
					Object.assign(hint.style, styles);
					hint.textContent = `${option.index}`;
					marksContainer.append(hint);
				}

				document.body.append(marksContainer);
			} else if (matches[0]) {
				clickElement(matches[0]);
			}
		}

		if (request.action.type === "click_hint") {
			console.log("Clicking hint");
			console.log(choices);
			const target = request.action.target as number;
			const targetNode = choices[target].element as HTMLElement;
			clickElement(targetNode);
			const marksContainer = document.querySelector("div#marks-container");
			marksContainer!.remove();
		}

		console.log("Message from the background script:");
		console.log(request);
		return { response: "Hi from content script" };
	});

	function clickElement(element: HTMLElement) {
		const previousColor = element.style.color;
		const previousBackground = element.style.background;
		element.style.background = "#FF8AAE";
		element.style.color = "#fff";
		setTimeout(() => {
			element?.click();
			element.style.background = previousBackground;
			element.style.color = previousColor;
		}, 200);
	}
}
