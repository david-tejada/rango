import { intersectors } from "./intersectors";

export function copyLink(hintText: string) {
	const target = intersectors.find(
		(intersector) => intersector.hintText === String(hintText)
	);
	if ((target?.element as HTMLLinkElement).href) {
		return (target?.element as HTMLLinkElement).href;
	}

	return undefined;
}
