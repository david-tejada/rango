import { getHostPattern } from "../../common/getHostPattern";
import { settings } from "../../common/settings/settings";
import { getAllFrames } from "../utils/getAllFrames";

export async function assertReferencesInCurrentTab(referenceNames: string[]) {
	await Promise.all(
		referenceNames.map(async (referenceName) =>
			assertReferenceInCurrentTab(referenceName)
		)
	);
}

export async function assertReferenceInCurrentTab(referenceName: string) {
	const frames = await getAllFrames();
	const references = await settings.get("references");

	const found = frames
		.map(({ url }) => getHostPattern(url))
		.some((hostPattern) => references.get(hostPattern)?.has(referenceName));

	if (!found) {
		throw new Error(`Reference "${referenceName}" not found in current tab.`);
	}
}
