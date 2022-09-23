/**
 * @jest-environment jsdom
 */

import { when } from "jest-when";
import { isHintable } from "./isHintable";

window.getComputedStyle = jest.fn();

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
		expect(isHintable(element)).toBe(true);
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
		expect(isHintable(element)).toBe(true);
	}
});

test("It returns true for elements with content editable", () => {
	document.body.innerHTML = `
			<p contenteditable="true">Click to edit</p>
			<p contenteditable="">Click to edit</p>
		`;

	const elements = document.body.querySelectorAll("p");

	for (const element of elements) {
		expect(isHintable(element)).toBe(true);
	}
});

test("It returns true for elements with attribute jsaction", () => {
	document.body.innerHTML = `
			<div jsaction="JqEhuc">Some clickable element</div>
		`;

	const element = document.querySelector("div")!;

	expect(isHintable(element)).toBe(true);
});

test("It returns false for redundant elements", () => {
	document.body.innerHTML = `
			<a href="#"><button>Click me!</button></a>
		`;

	const anchor = document.querySelector("a")!;
	const button = document.querySelector("button")!;

	anchor.getBoundingClientRect = jest.fn().mockReturnValue({ x: 210, y: 47 });
	button.getBoundingClientRect = jest.fn().mockReturnValue({ x: 210, y: 47 });

	expect(isHintable(anchor)).toBe(false);
	expect(isHintable(button)).toBe(true);
});

test("It returns true for the first element with cursor: pointer", () => {
	document.body.innerHTML = `
		<div class="wrapper">
			<div class="pointer">
				<div class="pointer-inner">Button</div>
			</div>
		</div>
	`;

	const wrapper = document.querySelector(".wrapper")!;
	const pointer = document.querySelector(".pointer")!;
	const pointerInner = document.querySelector(".pointer-inner")!;

	when(window.getComputedStyle)
		.calledWith(wrapper)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(pointer)
		.mockReturnValue({ cursor: "pointer" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(pointerInner)
		.mockReturnValue({ cursor: "pointer" } as CSSStyleDeclaration);

	expect(isHintable(pointer)).toBe(true);
	expect(isHintable(pointerInner)).toBe(false);
});

test("It returns false for the first element with cursor: pointer that is the first child of a clickable element", () => {
	document.body.innerHTML = `
		<a>
			<div class="pointer">
				<div class="pointer-inner">Button</div>
			</div>
		</a>
	`;

	const a = document.querySelector("a")!;
	const pointer = document.querySelector(".pointer")!;
	const pointerInner = document.querySelector(".pointer-inner")!;

	when(window.getComputedStyle)
		.calledWith(a)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(pointer)
		.mockReturnValue({ cursor: "pointer" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(pointerInner)
		.mockReturnValue({ cursor: "pointer" } as CSSStyleDeclaration);

	expect(isHintable(a)).toBe(true);
	expect(isHintable(pointer)).toBe(false);
	expect(isHintable(pointerInner)).toBe(false);
});

test("It returns true for the innermost element with class containing the word button that is not inside a hintable element", () => {
	document.body.innerHTML = `
		<div class="button-wrapper">
			<div class="button">Button</div>
		</div>
	`;

	const buttonWrapper = document.querySelector(".button-wrapper")!;
	const button = document.querySelector(".button")!;

	when(window.getComputedStyle)
		.calledWith(document.body)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(buttonWrapper)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(button)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	expect(isHintable(buttonWrapper)).toBe(false);
	expect(isHintable(button)).toBe(true);
});

test("It returns false for the elements with class containing the word button that are inside other hintable elements", () => {
	document.body.innerHTML = `
		<a>
			<div class="button-wrapper">
				<div class="button">Button</div>
			</div>
		</a>
	`;

	const a = document.querySelector("a")!;
	const buttonWrapper = document.querySelector(".button-wrapper")!;
	const button = document.querySelector(".button")!;

	when(window.getComputedStyle)
		.calledWith(buttonWrapper)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(button)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	expect(isHintable(a)).toBe(true);
	expect(isHintable(buttonWrapper)).toBe(false);
	expect(isHintable(button)).toBe(false);
});

test("It returns false for the elements with cursor: pointer that contain elements with the class containing the word button", () => {
	document.body.innerHTML = `
		<div class="pointer">
			<div class="button-wrapper">
				<div class="button">Button</div>
			</div>
		</div>
	`;

	const pointer = document.querySelector(".pointer")!;
	const buttonWrapper = document.querySelector(".button-wrapper")!;
	const button = document.querySelector(".button")!;

	when(window.getComputedStyle)
		.calledWith(pointer)
		.mockReturnValue({ cursor: "pointer" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(buttonWrapper)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	when(window.getComputedStyle)
		.calledWith(button)
		.mockReturnValue({ cursor: "auto" } as CSSStyleDeclaration);

	expect(isHintable(pointer)).toBe(false);
	expect(isHintable(buttonWrapper)).toBe(false);
	expect(isHintable(button)).toBe(true);
});

test("It returns true for nested clickables if they don't overlap", () => {
	document.body.innerHTML = `
			<a href="#"><button>Click me!</button></a>
		`;

	const anchor = document.querySelector("a")!;
	const button = document.querySelector("button")!;

	anchor.getBoundingClientRect = jest.fn().mockReturnValue({ x: 210, y: 47 });
	button.getBoundingClientRect = jest.fn().mockReturnValue({ x: 230, y: 47 });

	expect(isHintable(anchor)).toBe(true);
	expect(isHintable(button)).toBe(true);
});
