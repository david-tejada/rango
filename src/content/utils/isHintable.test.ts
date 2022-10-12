/**
 * @jest-environment jsdom
 */

import { when } from "jest-when";
import { isHintable } from "./isHintable";

window.getComputedStyle = jest.fn();

function mockRendering(origin: HTMLElement) {
	const elements = origin.querySelectorAll("*");

	for (const element of elements) {
		when(window.getComputedStyle)
			.calledWith(element)
			.mockReturnValue({
				cursor: element.className.includes("pointer") ? "pointer" : "auto",
			} as CSSStyleDeclaration);

		const rect = {
			x: 0,
			y: 0,
			width: 20,
			height: 50,
		};

		for (const key of Object.keys(rect)) {
			const attribute = element.getAttribute(key);
			if (attribute) {
				rect[key as keyof typeof rect] = Number.parseInt(attribute, 10);
			}
		}

		element.getBoundingClientRect = jest.fn().mockReturnValue(rect);
	}

	return elements;
}

const suites = [
	{
		description: "Clickable elements",
		cases: [
			{
				description: "It returns true for clickable element types",
				innerHTML: `
					<a href="#" hintable>Link</a>
					<button hintable>Button</button>
					<label for="input" hintable>Label</label>
					<input type="text" hintable>
					<details>
						<summary hintable>Details</summary>
						Full text.
					</details>
					<textarea name="" id="" cols="30" rows="10" hintable></textarea>
					<select name="" id="" hintable>
						<option value="" width="0" height="0" hintable>Option 1</option>
					</select>
				`,
			},
			{
				description: "It returns true for clickable roles",
				innerHTML: `
					<div role="button" hintable></div>
					<div role="link" hintable></div>
					<div role="treeitem" hintable></div>
					<div role="tab" hintable></div>
					<div role="radio" hintable></div>
					<div role="checkbox" hintable></div>
					<div role="menuitem" hintable></div>
					<div role="menuitemradio" hintable></div>
				`,
			},
			{
				description: "It returns true for contenteditable elements",
				innerHTML: `
					<p contenteditable="true" hintable>Click to edit</p>
					<p contenteditable="" hintable>Click to edit</p>
				`,
			},
			{
				description:
					"It returns true for nested clickables if they don't overlap",
				innerHTML: `
					<a href="#" hintable><button x="15" y="15" hintable>Click me!</button></a>
				`,
			},
		],
	},
	{
		description: "Redundant element",
		cases: [
			{
				description: "It returns false for redundant elements",
				innerHTML: `
					<a href="#"><button hintable>Click me!</button></a>
				`,
			},
		],
	},
	{
		description: "cursor: pointer",
		cases: [
			{
				description:
					"It returns true for the first element with cursor: pointer",
				innerHTML: `
					<div>
						<div class="pointer" hintable>
							<div class="pointer">Button</div>
						</div>
					</div>
				`,
			},
			{
				description:
					"It returns true for the first element with cursor: pointer with no element children",
				innerHTML: `
					<div>
						<div class="pointer" hintable>Button</div>
					</div>
				`,
			},
			{
				description:
					"It returns false for the first element with cursor: pointer that is the first child of a clickable element",
				innerHTML: `
					<a hintable>
						<div class="pointer">
							<div class="pointer">Button</div>
						</div>
					</a>
				`,
			},
		],
	},
	{
		description: "[class*='button']",
		cases: [
			{
				description:
					"It returns true for the innermost element with class containing the word button that is not inside a hintable element",
				innerHTML: `
					<div class="button-wrapper">
						<div class="button pointer" hintable>Button</div>
					</div>
				`,
			},
			{
				description:
					"It returns false for elements with class containing the word button that are inside other hintable elements",
				innerHTML: `
					<a hintable>
						<div class="button-wrapper">
							<div class="button">Button</div>
						</div>
					</a>
				`,
			},
		],
	},
];

describe.each(suites)("$description", ({ cases }) => {
	test.each(cases)("$description", ({ innerHTML }) => {
		document.body.innerHTML = innerHTML;
		const elements = mockRendering(document.body);

		for (const element of elements) {
			expect(isHintable(element), element.outerHTML).toBe(
				element.hasAttribute("hintable")
			);
		}
	});
});
