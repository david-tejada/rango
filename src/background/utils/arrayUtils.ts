// Function to filter an array in place
export function filterInPlace<T>(
	array: T[],
	filter: (item: T, index: number) => boolean
) {
	for (let i = array.length - 1; i >= 0; i--) {
		if (!filter(array[i]!, i)) {
			array.splice(i, 1);
		}
	}
}
