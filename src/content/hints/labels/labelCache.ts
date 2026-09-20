import { Mutex } from "async-mutex";
import { getLabelCandidates } from "../../../common/underlineLabels";
import { type LabelRequest } from "../../../typings/LabelRequest";
import { settingsSync } from "../../settings/settingsSync";
import { isMainFrame } from "../../setup/contentScriptContext";
import { reclaimLabels } from "../../wrappers/wrappers";
import {
	getUnderlineText,
	type UnderlineText,
} from "../underline/getUnderlineText";
import { supportsUnderlineHints } from "../underline/underlineHighlights";
import {
	claimLabels,
	initStack,
	reclaimLabelsFromOtherFrames,
	releaseLabels,
} from "./labelRequest";
import { clearLabelsInFrame } from "./labelsInFrame";

/**
 * A label reserved for a particular element. When it includes `underlineText`
 * the label can be rendered by underlining two of the characters of the text of
 * the element instead of by attaching a hint element to the page.
 */
export type LabelAssignment = {
	label: string;
	underlineText?: UnderlineText;
};

/**
 * The labels reserved for the elements of a batch, to be handed to
 * `Hint.claim`.
 *
 * These are returned by `cacheLabels` rather than kept in a module level map so
 * that two intersection callbacks running at the same time, which happens all
 * the time since `cacheLabels` awaits the background script, can't consume or
 * discard each other's labels.
 */
export type LabelAssignments = Map<Element, LabelAssignment>;

/**
 * Labels that have been claimed for elements within the viewport. These labels
 * cannot be reclaimed by other frames.
 */
const mainCache: string[] = [];

/**
 * Labels that have been claimed for elements that are intersecting but not
 * within the viewport. These labels are susceptible to be reclaimed if a
 * different frame requires more.
 */
const additionalCache: string[] = [];

/**
 * Labels that have been returned to the cache using `pushLabel`.
 */
const returnedLabels: string[] = [];

/**
 * Batches are serialized because `cacheLabels` awaits the background script,
 * and while it does another intersection callback can run and take from the
 * caches the very labels this batch is about to use.
 */
const mutex = new Mutex();

function labelsHeld() {
	return mainCache.length + additionalCache.length;
}

/**
 * Reserves a label for each of the elements passed, and caches any spare ones
 * so they can later be `popped` when a wrapper needs them.
 *
 * @param necessary - The elements that are within the viewport. Their labels
 * are absolutely necessary.
 * @param additional - The elements that are intersecting but not within the
 * viewport. Their labels are additional to the necessary ones.
 * @returns The label reserved for each element whose text can be underlined.
 * The rest take any label from the cache when they claim their hint.
 */
export async function cacheLabels(
	necessary: Element[],
	additional: Element[]
): Promise<LabelAssignments> {
	return mutex.runExclusive(async () =>
		cacheLabelsUnsafe(necessary, additional)
	);
}

async function cacheLabelsUnsafe(
	necessary: Element[],
	additional: Element[]
): Promise<LabelAssignments> {
	const elements = [...necessary, ...additional];
	const totalCount = elements.length;
	const assignments: LabelAssignments = new Map();

	const underlineTexts = getUnderlineTexts(elements);

	// Save any previously returned labels
	saveLabelsToCache([...returnedLabels]);
	returnedLabels.length = 0;

	// Serve what we can with the labels this frame already holds.
	assignFromCache(assignments, elements, underlineTexts);

	const pendingCount = totalCount - assignments.size;
	const necessaryPending = necessary.filter(
		(element) => !assignments.has(element)
	).length;

	// The labels we need from the stack on top of the ones we already hold. This
	// can be zero while we still have something to ask for: holding enough
	// labels is not the same as holding the right ones, since an underline hint
	// needs the one label that its text spells out. We ask for those too and
	// give back the surplus at the end.
	const topUp = Math.max(pendingCount - labelsHeld(), 0);
	const requests = buildRequests(assignments, elements, underlineTexts);

	if (topUp > 0 || requests.length > 0) {
		const { assigned, unassigned } = await claimLabels(topUp, requests);

		for (const [index, label] of Object.entries(assigned)) {
			const element = elements[Number(index)];
			if (element) {
				assignments.set(element, {
					label,
					underlineText: underlineTexts.get(element),
				});
			}
		}

		const labelsClaimed = [...unassigned];
		const minimumCount = Math.min(topUp, necessaryPending);

		// If there are not enough labels available we try to reclaim those labels
		// that are outside of the viewport in the same frame (for speed)
		if (labelsHeld() + labelsClaimed.length < minimumCount) {
			labelsClaimed.push(
				...reclaimLabels(minimumCount - labelsHeld() - labelsClaimed.length)
			);
		}

		// If after that there're still not enough labels available we reclaim
		// labels that are outside of the viewport from others frames
		if (labelsHeld() + labelsClaimed.length < minimumCount) {
			labelsClaimed.push(
				...(await reclaimLabelsFromOtherFrames(
					minimumCount - labelsHeld() - labelsClaimed.length
				))
			);
		}

		saveLabelsToCache(labelsClaimed, necessaryPending);

		// Some of the labels we just claimed might match the text of an element
		// that the stack couldn't assign a label to.
		assignFromCache(assignments, elements, underlineTexts);
	}

	// We hand the assignments to the caller before giving anything back, so that
	// this batch's labels are safe from whatever runs during the release.
	void releaseSurplus(totalCount - assignments.size);

	return assignments;
}

/**
 * Returns to the stack any label this frame holds beyond the `keep` it still
 * needs, so that other frames and later batches can use them.
 */
async function releaseSurplus(keep: number) {
	const surplus = labelsHeld() - keep;
	if (surplus <= 0) return;

	// The additional cache holds the labels for elements outside the viewport,
	// which are the ones we can most afford to give up.
	const toRelease = additionalCache.splice(0, surplus);
	if (toRelease.length < surplus) {
		toRelease.push(...mainCache.splice(0, surplus - toRelease.length));
	}

	await releaseLabels(toRelease);
}

/**
 * Computes the text that could be underlined for each element. Returns an empty
 * map when underline hints are off or unsupported, in which case every element
 * gets a regular hint.
 */
function getUnderlineTexts(elements: Element[]) {
	const underlineTexts = new Map<Element, UnderlineText>();

	if (!settingsSync.get("underlineHints") || !supportsUnderlineHints()) {
		return underlineTexts;
	}

	for (const element of elements) {
		try {
			const underlineText = getUnderlineText(element);
			if (underlineText) underlineTexts.set(element, underlineText);
		} catch (error: unknown) {
			// Underlining is a nicety. If anything goes wrong reading the text of an
			// element it just gets a regular hint, but it must never prevent the rest
			// of the elements from being hinted.
			console.error("Rango: unable to read the text of a hintable.", error);
		}
	}

	return underlineTexts;
}

/**
 * Builds the requests to send to the background script, for the elements that
 * don't have a label yet. We use the index of the element within the batch as
 * its id. Elements without underlinable text are left out, they just need any
 * label.
 */
function buildRequests(
	assignments: LabelAssignments,
	elements: Element[],
	underlineTexts: Map<Element, UnderlineText>
): LabelRequest[] {
	const requests: LabelRequest[] = [];

	for (const [index, element] of elements.entries()) {
		const underlineText = underlineTexts.get(element);
		if (underlineText && !assignments.has(element)) {
			requests.push({ id: String(index), text: underlineText.text });
		}
	}

	return requests;
}

/**
 * Assigns to the elements that still don't have one a label from the cache that
 * matches their text. This way we can underline elements using labels this
 * frame already holds, without having to ask the background script for them.
 *
 * Elements with the fewest options go first, for the same reason the background
 * script serves them first: a label that is one element's only chance at an
 * underline is often just one of many for another.
 */
function assignFromCache(
	assignments: LabelAssignments,
	elements: Element[],
	underlineTexts: Map<Element, UnderlineText>
) {
	if (underlineTexts.size === 0 || labelsHeld() === 0) return;

	const available = new Set([...mainCache, ...additionalCache]);

	const candidates = elements
		.filter(
			(element) => !assignments.has(element) && underlineTexts.has(element)
		)
		.map((element) => ({
			element,
			labels: getLabelCandidates(underlineTexts.get(element)!.text)
				.map(({ label }) => label)
				.filter((label) => available.has(label)),
		}))
		.filter(({ labels }) => labels.length > 0)
		.sort((a, b) => a.labels.length - b.labels.length);

	for (const { element, labels } of candidates) {
		const label = labels.find((label) => available.has(label));
		if (!label) continue;

		available.delete(label);
		const cache = mainCache.includes(label) ? mainCache : additionalCache;
		cache.splice(cache.indexOf(label), 1);

		assignments.set(element, {
			label,
			underlineText: underlineTexts.get(element),
		});
	}
}

/**
 * Takes any label from the cache, for an element that doesn't have one reserved
 * for it.
 */
export function popLabel(): string | undefined {
	let label = mainCache.pop() ?? additionalCache.pop();

	if (!label) {
		// If there are no labels remaining in the cache we see if we can retrieve
		// the labels in the current frame that are not intersecting the viewport
		[label] = reclaimLabels(1);
	}

	return label;
}

export function pushLabel(label: string) {
	returnedLabels.push(label);
}

/**
 * Saves labels to the cache.
 *
 * @param labels - The labels to save.
 * @param toMain - The number of labels that should be saved to the main cache.
 */
function saveLabelsToCache(labels: string[], toMain = 0) {
	const labelsSorted = [...labels].sort(
		(a, b) => b.length - a.length || b.localeCompare(a)
	);

	const [labelsToAdditional, labelsToMain] = [
		labelsSorted.slice(0, -toMain),
		labelsSorted.slice(-toMain),
	];

	mainCache.push(...labelsToMain);
	additionalCache.push(...labelsToAdditional);

	sortCache();
}

/**
 * Sorts the labels in the cache.
 * The sorted array will be like this: `["zz", "zy", "zx", ..., "c", "b", "a"]`
 */
function sortCache() {
	mainCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
	additionalCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
}

export function reclaimLabelsFromCache(amount: number) {
	return additionalCache.splice(-amount, amount);
}

/**
 * Clears the labels cache and resets the stack if it's the main frame.
 */
export async function clearLabelsCache() {
	mainCache.length = 0;
	additionalCache.length = 0;
	returnedLabels.length = 0;

	clearLabelsInFrame();

	if (isMainFrame()) await initStack();
}

/**
 * Returns the labels in the cache. This function is just used for debugging
 * purposes.
 *
 * @returns The labels in the cache.
 */
export function getLabelCache() {
	return {
		main: mainCache,
		additional: additionalCache,
		returned: returnedLabels,
	};
}
