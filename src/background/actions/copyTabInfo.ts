import { Tabs } from "webextension-polyfill";
import { promiseWrap } from "../../lib/promiseWrap";
import { assertDefined } from "../../typings/TypingUtils";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
import { notify } from "../utils/notify";
import { RangoActionCopyLocationProperty } from "../../typings/RangoAction";

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
	let [title] = await promiseWrap(
		sendRequestToContent({
			type: "getTitleBeforeDecoration",
		}) as Promise<string>
	);

	title ??= tab.title;

	assertDefined(tab.url);
	assertDefined(title);

	await notify("Copied to the clipboard", { type: "success" });

	return `[${title}](${tab.url})`;
}
