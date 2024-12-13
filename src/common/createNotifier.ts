export type NotificationType =
	| "success"
	| "warning"
	| "error"
	| "info"
	| "enabled"
	| "disabled"
	| "trash";

export function createNotifier(
	callback: (text: string, type: NotificationType, toastId?: string) => void
) {
	return {
		async success(text: string, toastId?: string) {
			callback(text, "success", toastId);
		},
		async warning(text: string, toastId?: string) {
			callback(text, "warning", toastId);
		},
		async error(text: string, toastId?: string) {
			callback(text, "error", toastId);
		},
		async info(text: string, toastId?: string) {
			callback(text, "info", toastId);
		},
		async enabled(text: string, toastId?: string) {
			callback(text, "enabled", toastId);
		},
		async disabled(text: string, toastId?: string) {
			callback(text, "disabled", toastId);
		},
		async trash(text: string, toastId?: string) {
			callback(text, "trash", toastId);
		},
	};
}
