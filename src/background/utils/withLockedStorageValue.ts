import { Mutex } from "async-mutex";
import { StorageSchema } from "../../typings/StorageSchema";
import { retrieve, store } from "../../common/storage";

const mutexes = new Map<keyof StorageSchema, Mutex>();

function getMutexForStorageValue(name: keyof StorageSchema) {
	if (mutexes.has(name)) return mutexes.get(name)!;

	const mutex = new Mutex();
	mutexes.set(name, mutex);

	return mutex;
}

/**
 * Retrieves and executes the callback for a given storage variable. It makes
 * sure there are no race conditions by locking the variable with a mutex.
 */
export async function withLockedStorageValue<T extends keyof StorageSchema, U>(
	name: T,
	callback: (value: StorageSchema[T]) => Promise<U>
): Promise<U> {
	const mutex = getMutexForStorageValue(name);

	return mutex.runExclusive(async () => {
		const value = await retrieve(name);
		const result = await callback(value);
		await store(name, value);
		return result;
	});
}
