/**
 * @jest-environment jsdom
 */

import { when } from "jest-when";
import { getSuitableHintContainer } from "./getSuitableHintContainer";

window.getComputedStyle = jest.fn();

function mockGetComputedStyle(
	element: HTMLElement,
	styles?: Record<string, string>
) {
	const allStyles: Record<string, string> = {
		display: "block",
		borderLeftWidth: "0px",
		borderTopWidth: "0px",
	};

	if (styles) {
		for (const [key, value] of Object.entries(styles)) {
			allStyles[key] = value;
		}
	}

	when(window.getComputedStyle)
		.calledWith(element)
		.mockReturnValue(allStyles as unknown as CSSStyleDeclaration);
}

let div: HTMLDivElement;
let a: HTMLAnchorElement;
let summary: HTMLElement;

beforeAll(() => {
	document.body.innerHTML = `
    <div>
      <a href="#">Link</a>
      <details>
        <summary>Click to reveal</summary>
        Full text.
      </details>
    </div>
  `;

	div = document.querySelector("div")!;
	a = document.querySelector("a")!;
	summary = document.querySelector("summary")!;

	div.getBoundingClientRect = jest.fn().mockReturnValue({ x: 0, y: 0 });
	mockGetComputedStyle(document.body);
});

test("It returns the parent block container if there is enough space", () => {
	a.getBoundingClientRect = jest.fn().mockReturnValue({ x: 15, y: 15 });
	mockGetComputedStyle(div);

	expect(getSuitableHintContainer(a)).toBe(div);
});

test("It returns the parent block container if there is not enough space but the next ancestor is document.body", () => {
	a.getBoundingClientRect = jest.fn().mockReturnValue({ x: 5, y: 5 });
	expect(getSuitableHintContainer(a)).toBe(div);
});

test("It skips the parent block container if there is no enough space and parent is 'overflow: hidden'", () => {
	a.getBoundingClientRect = jest.fn().mockReturnValue({ x: 5, y: 5 });
	mockGetComputedStyle(div, { overflow: "hidden" });

	expect(getSuitableHintContainer(a)).toBe(document.body);
});

test("It won't return an element beyond a container with 'position: fixed'", () => {
	a.getBoundingClientRect = jest.fn().mockReturnValue({ x: 5, y: 5 });
	mockGetComputedStyle(div, {
		position: "fixed",
		top: "0px",
		overflow: "hidden",
	});

	expect(getSuitableHintContainer(a)).toBe(div);
});

test("It won't return an element beyond a container with 'position: sticky'", () => {
	a.getBoundingClientRect = jest.fn().mockReturnValue({ x: 5, y: 5 });
	mockGetComputedStyle(div, {
		position: "sticky",
		top: "0px",
		overflow: "hidden",
	});

	expect(getSuitableHintContainer(a)).toBe(div);
});

test("It skips the parent block container if it's a <summary> element", () => {
	summary.getBoundingClientRect = jest.fn().mockReturnValue({ x: 20, y: 20 });
	mockGetComputedStyle(div);

	expect(getSuitableHintContainer(summary)).toBe(div);
});
