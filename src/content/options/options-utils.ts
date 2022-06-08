import { triggerHintsUpdate } from "../hints/display-hints";
import { getOption, setOption } from "./options";

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

export async function toggleHints() {
	const showHints = !getOption("showHints");
	await setOption({ showHints });

	await triggerHintsUpdate(true);
}
