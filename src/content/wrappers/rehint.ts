import { cacheLabels } from "../hints/labels/labelCache";
import { isContextInvalidated } from "../messaging/messageHandler";
import { getAllWrappers } from "./wrappers";

const initialRetryDelay = 1000;
const maximumRetryDelay = 30_000;

let retryDelay = initialRetryDelay;
let retryTimeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Schedules another attempt at hinting the elements that are intersecting but
 * ended up without a label. Without this a single failed message would leave
 * them unhinted for as long as the page is open, since an Intersection Observer
 * only reports a change in intersection.
 */
export function scheduleRehint() {
	if (retryTimeout ?? isContextInvalidated()) return;

	retryTimeout = setTimeout(async () => {
		retryTimeout = undefined;
		await rehintPending();
	}, retryDelay);
}

/**
 * Claims a label for every element that should have a hint and doesn't. Apart
 * from recovering from a failed claim, this is how an element gets a label that
 * suits its text again after the page has rewritten it.
 */
export async function rehintPending() {
	const pending = getAllWrappers().filter(
		(wrapper) =>
			wrapper.isIntersecting && wrapper.shouldBeHinted && !wrapper.hint?.label
	);

	if (pending.length === 0) {
		retryDelay = initialRetryDelay;
		return;
	}

	try {
		const assignments = await cacheLabels(
			pending
				.filter((wrapper) => wrapper.isIntersectingViewport)
				.map((wrapper) => wrapper.element),
			pending
				.filter((wrapper) => !wrapper.isIntersectingViewport)
				.map((wrapper) => wrapper.element)
		);

		for (const wrapper of pending) wrapper.intersect(true, assignments);
		retryDelay = initialRetryDelay;
	} catch {
		// Back off so that a background script that stays unreachable doesn't have
		// us retrying in a tight loop for the lifetime of the page.
		retryDelay = Math.min(retryDelay * 2, maximumRetryDelay);
		scheduleRehint();
	}
}
