type TalonActionCopyToClipboard = {
	name: "copyToClipboard";
	textToCopy: string;
};

type TalonActionTypeTargetCharacters = {
	name: "typeTargetCharacters";
	previousName?: "noHintFound";
};

type TalonActionKey = {
	name: "key";
	key: string;
};

type TalonActionEditDelete = {
	name: "editDelete";
	previousName?: "editDeleteAfterDelay";
};

type TalonActionSleep = {
	name: "sleep";
	ms?: number;
};

type TalonActionFocusPage = {
	name: "focusPage";
};

type TalonActionFocusPageAndResend = {
	name: "focusPageAndResend";
};

type TalonActionResponseValue = {
	name: "responseValue";
	value: any;
};

type TalonActionOpenInNewTab = {
	name: "openInNewTab";
	url: string;
};

type TalonActionPrintError = {
	name: "printError";
	message: string;
};

export type TalonAction =
	| TalonActionCopyToClipboard
	| TalonActionTypeTargetCharacters
	| TalonActionKey
	| TalonActionEditDelete
	| TalonActionSleep
	| TalonActionFocusPage
	| TalonActionFocusPageAndResend
	| TalonActionResponseValue
	| TalonActionOpenInNewTab
	| TalonActionPrintError;
