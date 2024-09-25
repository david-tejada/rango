import { type Tabs } from "webextension-polyfill";
import { promiseWrap } from "../../lib/promiseWrap";
import { assertDefined } from "../../typings/TypingUtils";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
import { notify } from "../utils/notify";
import { type RangoActionCopyLocationProperty } from "../../typings/RangoAction";

export async function getBareTitle(tab: Tabs.Tab) {
	const [title] = await promiseWrap(
		sendRequestToContent({
			type: "getTitleBeforeDecoration",
		}) as Promise<string>
	);

	return title ?? tab.title;
}

export async function copyLocationProperty(
	tab: Tabs.Tab,
	property: RangoActionCopyLocationProperty["arg"]
) {
	assertDefined(tab.url);

	await notify("Copied to the clipboard", { type: "success" });

	const url = new URL(tab.url);
	const result = url[property];

	return result;
}

export async function copyMarkdownUrl(tab: Tabs.Tab) {
	const title = await getBareTitle(tab);
	assertDefined(tab.url);
	assertDefined(title);

	await notify("Copied to the clipboard", { type: "success" });

	return `[${title}](${tab.url})`;
}
