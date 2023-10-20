import { withLockedStorageAccess } from "./withLockedStorageValue";

export async function removeReference(hostPattern: string, name: string) {
	return withLockedStorageAccess("references", (references) => {
		references.get(hostPattern)?.delete(name);
	});
}
