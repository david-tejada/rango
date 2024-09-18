export function isValidRegExp(text: string) {
	try {
		new RegExp(text); // eslint-disable-line no-new
		return true;
	} catch {
		return false;
	}
}
