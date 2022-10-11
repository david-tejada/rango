/**
 * @jest-environment jsdom
 */

// We need to import mockIntersectionObserver before ElementWrapper
// eslint-disable-next-line import/no-unassigned-import
import "../../tests/utils/mockIntersectionObserver";
// eslint-disable-next-line import/no-unassigned-import
import "../../tests/utils/mockResizeObserver";
import { addWrapper, getWrapper } from "./wrappers";

jest.mock("webextension-polyfill", () => ({}));

document.elementsFromPoint = jest.fn().mockReturnValue([]);

describe("wrappers.get", () => {
	test("It creates a wrapper for the parent if it doesn't exist", () => {
		document.body.innerHTML = `
    <div>
      <p><a href="#"><span>Link</span></a></p>
    </div>
  `;

		const div = document.querySelector("div")!;
		const span = document.querySelector("span")!;

		addWrapper(span);

		expect(() => {
			getWrapper(div);
		}).not.toThrowError();
		expect(getWrapper(div).element).toBe(div);
	});
});
