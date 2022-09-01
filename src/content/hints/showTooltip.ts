import tippy from "tippy.js";
import { Hintable } from "../Hintable";

export function showTooltip(
	hintable: Hintable,
	text: string,
	duration: number
) {
	const hintElement = hintable.hint?.innerDiv as HTMLElement;
	hintElement.id = "rango-tooltip";
	hintElement.dataset["tippyContent"] = text;
	const instance = tippy(hintElement, {
		zIndex: 2_147_483_647,
		appendTo: hintElement.parentElement!,
		maxWidth: "none",
		allowHTML: true,
	});
	instance.show();

	hintable.hint?.flash(duration);
	setTimeout(() => {
		instance.hide();
		hintElement.removeAttribute("id");
	}, duration);
}
