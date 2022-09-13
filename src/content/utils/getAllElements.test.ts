/**
 * @jest-environment jsdom
 */

import { getAllElements } from "./getAllElements";

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
		const descendants = getAllElements(document.body);
		expect(descendants.length).toBe(5);
	});

	test("It returns shadow dom elements", () => {
		const shadowOutput = document.querySelector("#shadow-output");
		const shadow = shadowOutput?.attachShadow({ mode: "open" });
		const p = document.createElement("p");
		shadow?.append(p);

		const descendants = getAllElements(document.body);
		expect(descendants.includes(p)).toBe(true);
		expect(descendants.length).toBe(6);
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

		const descendants = getAllElements(document.body);
		expect(descendants.includes(p)).toBe(true);
		expect(descendants.includes(h1)).toBe(true);
		expect(descendants.length).toBe(8);
	});
});
