import { promiseWrap } from "../../lib/promiseWrap";
import { sendRequestToContent } from "../messaging/sendRequestToContent";

let triedToFocusDocument = false;

export async function shouldTryToFocusDocument(): Promise<boolean> {
	// This only works in Firefox, and I'm not sure if always
	await sendRequestToContent({ type: "tryToFocusPage" });

	const [focusedDocument] = await promiseWrap(
		sendRequestToContent({
			type: "checkIfDocumentHasFocus",
		}) as Promise<boolean>
	);

	if (!focusedDocument && !triedToFocusDocument) {
		triedToFocusDocument = true;
		setTimeout(() => {
			triedToFocusDocument = false;
		}, 3000);
		return true;
	}

	return false;
}
