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
 * Retrieves a given storage variable and executes the callback with the value
 * as argument. It makes sure there are no race conditions by locking the
 * variable with a mutex.
 *
 * @param name The name of the storage item
 * @param callback The callback to execute on the value
 * @returns The result of the callback
 */
export async function withLockedStorageAccess<T extends keyof StorageSchema, U>(
	name: T,
	callback: (value: StorageSchema[T]) => U | Promise<U>
): Promise<U> {
	const mutex = getMutexForStorageValue(name);

	return mutex.runExclusive(async () => {
		const value = await retrieve(name);
		const result = await Promise.resolve(callback(value));
		await store(name, value);
		return result;
	});
}
