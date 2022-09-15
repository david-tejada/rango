/**
 * @jest-environment jsdom
 */

import { shouldBeHinted } from "./shouldBeHinted";

test("It returns true for clickable element types", () => {
	document.body.innerHTML = `
      <a href="#">Link</a>
      <button>Button</button>
      <label for="input">Label</label>
      <input type="text">
      <details>
        <summary>Details</summary>
        Full text.
      </details>
      <textarea name="" id="" cols="30" rows="10"></textarea>
      <select name="" id="">
        <option value="">Option 1</option>
      </select>
    `;

	const elements = document.body.querySelectorAll(":not(details)");

	for (const element of elements) {
		expect(shouldBeHinted(element)).toBe(true);
	}
});

test("It returns true for clickable roles", () => {
	document.body.innerHTML = `
			<div role="button"></div>
			<div role="link"></div>
			<div role="treeitem"></div>
			<div role="tab"></div>
			<div role="radio"></div>
			<div role="checkbox"></div>
			<div role="menuitem"></div>
			<div role="menuitemradio"></div>
		`;

	const elements = document.querySelectorAll("div");

	for (const element of elements) {
		expect(shouldBeHinted(element)).toBe(true);
	}
});

test("It returns true for elements with content editable", () => {
	document.body.innerHTML = `
			<p contenteditable="true">Click to edit</p>
			<p contenteditable="">Click to edit</p>
		`;

	const elements = document.body.querySelectorAll("p");

	for (const element of elements) {
		expect(shouldBeHinted(element)).toBe(true);
	}
});

test("It returns true for elements with attribute jsaction", () => {
	document.body.innerHTML = `
			<div jsaction="JqEhuc">Some clickable element</div>
		`;

	const element = document.querySelector("div")!;

	expect(shouldBeHinted(element)).toBe(true);
});

test("It returns false for redundant elements", () => {
	document.body.innerHTML = `
			<a href="#"><button>Click me!</button></a>
		`;

	const anchor = document.querySelector("a")!;
	const button = document.querySelector("button")!;

	anchor.getBoundingClientRect = jest.fn().mockReturnValue({ x: 210, y: 47 });
	button.getBoundingClientRect = jest.fn().mockReturnValue({ x: 210, y: 47 });

	expect(shouldBeHinted(anchor)).toBe(false);
	expect(shouldBeHinted(button)).toBe(true);
});

test("It returns true for nested clickables if they don't overlap", () => {
	document.body.innerHTML = `
			<a href="#"><button>Click me!</button></a>
		`;

	const anchor = document.querySelector("a")!;
	const button = document.querySelector("button")!;

	anchor.getBoundingClientRect = jest.fn().mockReturnValue({ x: 210, y: 47 });
	button.getBoundingClientRect = jest.fn().mockReturnValue({ x: 230, y: 47 });

	expect(shouldBeHinted(anchor)).toBe(true);
	expect(shouldBeHinted(button)).toBe(true);
});
