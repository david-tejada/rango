import tippy from "tippy.js";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";

export function showTooltip(
	wrapper: ElementWrapper,
	text: string,
	duration: number
) {
	assertDefined(wrapper.hint);

	const hintInner = wrapper.hint.inner;
	hintInner.id = "rango-tooltip";
	hintInner.dataset["tippyContent"] = text;

	const instance = tippy(hintInner, {
		zIndex: 2_147_483_647,
		appendTo: hintInner.parentElement!,
		maxWidth: "none",
		allowHTML: true,
	});

	instance.show();

	wrapper.hint.flash(duration);

	setTimeout(() => {
		instance.hide();
		hintInner.removeAttribute("id");
	}, duration);
}
