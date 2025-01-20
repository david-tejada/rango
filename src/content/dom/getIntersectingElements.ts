/**
 * Get all elements that are intersecting the viewport.
 *
 * @param elements - The elements to check for intersection.
 * @returns A promise that resolves to an array of intersecting elements.
 */
export async function getIntersectingElements(
	elements: Element[] | NodeListOf<Element>
) {
	const result: Element[] = [];

	const { promise, resolve } = createPromise<void>();

	const intersectionObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				result.push(entry.target);
			}
		}

		resolve();
	});

	for (const element of elements) {
		intersectionObserver.observe(element);
	}

	await promise;
	intersectionObserver.disconnect();
	return result;
}

function createPromise<T>() {
	let resolve_!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>((resolve) => {
		resolve_ = resolve;
	});
	return { promise, resolve: resolve_ };
}
