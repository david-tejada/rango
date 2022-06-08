import { triggerHintsUpdate } from "../hints/display-hints";
import { getOption, setOption } from "./options-utils";

export async function increaseHintSize() {
	const hintFontSize = (getOption("hintFontSize") as number) + 1;
	await setOption({ hintFontSize });
	await triggerHintsUpdate();
}

export async function decreaseHintSize() {
	const hintFontSize = (getOption("hintFontSize") as number) - 1;
	await setOption({ hintFontSize });
	await triggerHintsUpdate();
}

export async function setHintStyle(hintStyle: string) {
	await setOption({ hintStyle });
	await triggerHintsUpdate();
}

export async function setHintWeight(hintWeight: string) {
	await setOption({ hintWeight });
	await triggerHintsUpdate();
}

export async function toggleHints() {
	const showHints = !getOption("showHints");
	await setOption({ showHints });

	await triggerHintsUpdate(true);
}
