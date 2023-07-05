import { resetStagedSelectors } from "../hints/customSelectorsStaging";
import { refresh } from "../wrappers/refresh";
import { resetExtraHintsToggles } from "./customHints";

export async function refreshHints() {
	await resetStagedSelectors();
	resetExtraHintsToggles();
	await refresh({ hintsColors: true, hintsCharacters: true, isHintable: true });
}
