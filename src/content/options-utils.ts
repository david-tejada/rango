import { getOption, setOption } from "../lib/options";
import { displayHints } from "./hints";

export async function increaseHintSize() {
	const hintFontSize = ((await getOption("hintFontSize")) as number) + 1;
	await setOption({ hintFontSize });
	await displayHints();
}

export async function decreaseHintSize() {
	const hintFontSize = ((await getOption("hintFontSize")) as number) - 1;
	await setOption({ hintFontSize });
	await displayHints();
}

export async function toggleHints() {
	const showHints = !(await getOption("showHints"));
	await setOption({ showHints });

	const hintsContainer = document.querySelector("#rango-hints-container");
	if (hintsContainer && !showHints) {
		(hintsContainer as HTMLDivElement).style.display = "none";
	} else {
		(hintsContainer as HTMLDivElement).style.display = "block";
	}

	await displayHints();
}
