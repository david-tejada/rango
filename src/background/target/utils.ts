/**
 * Return a new `Map` with the same keys as the original but with its values
 * being the result of executing the callback on the original values.
 */
export function mapMapValues<K, V, R>(
	map: Map<K, V>,
	callback: (value: V) => R
): Map<K, R> {
	return new Map(
		Array.from(map.entries(), ([key, value]) => [key, callback(value)])
	);
}
