import { getHostPattern } from "../../common/getHostPattern";
import { retrieve } from "../../common/storage/storage";
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
	const references = await retrieve("references");

	const found = frames
		.map(({ url }) => getHostPattern(url))
		.some((hostPattern) => references.get(hostPattern)?.has(referenceName));

	if (!found) {
		throw new Error(`Reference "${referenceName}" not found in current tab.`);
	}
}
