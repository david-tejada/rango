/**
 * Filters an array in place. It returns a reference to the original array, now
 * filtered.
 */
export function filterArrayInPlace<T>(
	array: T[],
	filter: (item: T, index: number) => boolean
) {
	for (let i = array.length - 1; i >= 0; i--) {
		if (!filter(array[i]!, i)) {
			array.splice(i, 1);
		}
	}

	return array;
}
