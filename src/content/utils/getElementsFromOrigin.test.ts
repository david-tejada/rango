/**
 * @jest-environment jsdom
 */

import { getElementsFromOrigin } from "./getElementsFromOrigin";

describe("getDescendantElements", () => {
	beforeEach(() => {
		document.body.innerHTML = `
      <div>
        <div>
          <p>Paragraph</p>
        </div>
        <div id="shadow-output"></div>
      </div>
    `;
	});

	test("It returns the right amount of elements", () => {
		expect(getElementsFromOrigin(document.body).length).toBe(5);
	});

	test("It returns shadow dom elements", () => {
		const shadowOutput = document.querySelector("#shadow-output");
		const shadow = shadowOutput?.attachShadow({ mode: "open" });
		const p = document.createElement("p");
		shadow?.append(p);

		const allElements = getElementsFromOrigin(document.body);
		expect(allElements.includes(p)).toBe(true);
		expect(allElements.length).toBe(6);
	});

	test("It returns nested shadow dom elements", () => {
		// Outer shadow
		const shadowOutput = document.querySelector("#shadow-output");
		const shadow = shadowOutput?.attachShadow({ mode: "open" });
		const p = document.createElement("p");
		shadow?.append(p);

		// Inner Shadow
		const nestedShadowOutput = document.createElement("div");
		shadow?.append(nestedShadowOutput);
		const nestedShadow = nestedShadowOutput.attachShadow({ mode: "open" });
		const h1 = document.createElement("h1");
		nestedShadow?.append(h1);

		const allElements = getElementsFromOrigin(document.body);
		const descendants = getElementsFromOrigin(document.body, false);

		expect(allElements.includes(p)).toBe(true);
		expect(allElements.includes(h1)).toBe(true);
		expect(allElements.length).toBe(8);
		expect(descendants.length).toBe(7);
	});

	test("It doesn't return the origin element if getOrigin is set to false", () => {
		const descendants = getElementsFromOrigin(document.body, false);
		expect(descendants.includes(document.body)).toBe(false);
		expect(descendants.length).toBe(4);
	});
});
