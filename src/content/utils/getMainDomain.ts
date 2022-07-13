import { parseDomain, ParseResultType, fromUrl } from "parse-domain";

export function getMainDomain(url: string): string | undefined {
	const parseResult = parseDomain(fromUrl(url));

	// Check if the domain is listed in the public suffix list
	if (parseResult.type === ParseResultType.Listed) {
		const { domain, topLevelDomains } = parseResult;

		const topLevel = topLevelDomains.join(".");
		return `${domain!}.${topLevel}`;
	}

	return undefined;
}
