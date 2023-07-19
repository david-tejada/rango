export function isSafari(): boolean {
	if (!navigator.vendor) return false;
	return navigator.vendor.includes("Apple");
}
