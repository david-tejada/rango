export function getHostPattern(url: string) {
	try {
		const urlObject = new URL(url);
		if (urlObject.protocol.includes("http")) {
			return `https?://${urlObject.host}/*`;
		}

		return urlObject.href;
	} catch {
		return url;
	}
}
