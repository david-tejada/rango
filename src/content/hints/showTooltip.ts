/* eslint-disable unicorn/prefer-module */
/* eslint-disable unicorn/prefer-node-protocol */
import fs from "fs";
import path from "path";
import tippy from "tippy.js";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";

const tippyCss = fs.readFileSync(path.join(__dirname, "tippy.css"), "utf8");

export function showTooltip(
	wrapper: ElementWrapper,
	text: string,
	duration: number
) {
	assertDefined(wrapper.hint);

	const style = document.createElement("style");
	style.textContent = tippyCss;
	wrapper.hint.shadowHost.shadowRoot!.append(style);

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
		// If we remove the styles immediately the transition looks awful
		setTimeout(() => {
			style.remove();
		}, 1000);
	}, duration);
}
