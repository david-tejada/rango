type TalonActionBase<T extends string, P = {}> = { name: T } & P;

export type TalonAction =
	| TalonActionBase<"copyToClipboard", { textToCopy: string }>
	| TalonActionBase<"editDelete">
	| TalonActionBase<"editLineStart">
	| TalonActionBase<"editLineEnd">
	| TalonActionBase<"focusPage">
	| TalonActionBase<"focusPageAndResend">
	| TalonActionBase<"key", { key: string }>
	| TalonActionBase<"openInNewTab", { url: string }>
	| TalonActionBase<"throwError", { message: string }>
	| TalonActionBase<"responseValue", { value: any }>
	| TalonActionBase<"sleep", { ms?: number }>
	| TalonActionBase<"typeTargetCharacters">;
