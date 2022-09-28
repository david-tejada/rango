/**
 * @jest-environment jsdom
 */

import { getEffectiveOpacity } from "./getEffectiveOpacity";

test("Calculates the right effective opacity", () => {
	document.body.innerHTML = `
    <div>
      <p><a href="#"><span>Link</span></a></p>
    </div>i
  `;

	const div = document.querySelector("div")!;
	const p = document.querySelector("p")!;
	const a = document.querySelector("a")!;
	const span = document.querySelector("span")!;

	// Since jsdom doesn't have rendering we have to set the opacity manually
	document.documentElement.style.opacity = "1";
	document.body.style.opacity = "1";
	div.style.opacity = "1";
	p.style.opacity = "0.5";
	a.style.opacity = "0.5";
	span.style.opacity = "1";

	expect(getEffectiveOpacity(document.documentElement)).toBe(1);
	expect(getEffectiveOpacity(document.body)).toBe(1);
	expect(getEffectiveOpacity(div)).toBe(1);
	expect(getEffectiveOpacity(p)).toBe(0.5);
	expect(getEffectiveOpacity(a)).toBe(0.25);
	expect(getEffectiveOpacity(span)).toBe(0.25);
});
