import { getOption, setOption } from "../lib/options";
import { displayHints } from "./hints";

export async function increaseHintSize() {
	const hintFontSize = (getOption("hintFontSize") as number) + 1;
	await setOption({ hintFontSize });
	await displayHints();
}

export async function decreaseHintSize() {
	const hintFontSize = (getOption("hintFontSize") as number) - 1;
	await setOption({ hintFontSize });
	await displayHints();
}

export async function toggleHints() {
	const showHints = !getOption("showHints");
	await setOption({ showHints });

	await displayHints(true);
}
