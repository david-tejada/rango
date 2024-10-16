import { sendMessage } from "webext-bridge/background";
import { type Tabs } from "webextension-polyfill";
import { type RangoActionCopyLocationProperty } from "../../typings/RangoAction";
import { assertDefined } from "../../typings/TypingUtils";
import { notify } from "../utils/notify";

export async function getBareTitle(tab: Tabs.Tab) {
	if (!tab.id) throw new Error("Unable to retrieve title of current tab.");

	const title = sendMessage(
		"getTitleBeforeDecoration",
		undefined,
		`content-script@${tab.id}`
	);

	return title ?? tab.title;
}

export async function copyLocationProperty(
	tab: Tabs.Tab,
	property: RangoActionCopyLocationProperty["arg"]
) {
	await notify("Copied to the clipboard", { type: "success" });

	const url = new URL(tab.url!);
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
