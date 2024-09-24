import { createRoot } from "react-dom/client";
import { type ToastOptions, toast } from "react-toastify";
import { getSetting } from "../settings/settingsManager";
import { isCurrentTab, isMainframe } from "../setup/contentScriptContext";
import { Toast } from "./Toast";
import { ToastIcon } from "./ToastIcon";
import { ToastMessage } from "./ToastMessage";
import { TogglesStatusMessage } from "./ToastTogglesMessage";

let notificationAllowed = false;

// This is to avoid the notification showing up if the user hasn't issued any
// command. For example, we reset hintsToggleTabs every time the extension
// starts
export function allowToastNotification() {
	notificationAllowed = true;

	setTimeout(() => {
		notificationAllowed = false;
	}, 1500);
}

function renderToast() {
	let toastContainer = document.querySelector("#rango-toast");

	if (!toastContainer) {
		toastContainer = document.createElement("div");
		toastContainer.id = "rango-toast";
		document.body.append(toastContainer);
		const root = createRoot(toastContainer);
		root.render(<Toast />);
	}
}

async function shouldNotify() {
	if (
		!notificationAllowed ||
		document.visibilityState !== "visible" ||
		!getSetting("enableNotifications") ||
		!isMainframe() ||
		!(await isCurrentTab())
	) {
		return false;
	}

	return true;
}

export async function notify(text: string, options?: ToastOptions) {
	if (!(await shouldNotify())) return;

	renderToast();

	const autoClose = getSetting("toastDuration");

	options = Object.assign({ autoClose }, options);

	if (options?.icon === "enabled") {
		options.icon = <ToastIcon iconType="enabled" />;
	}

	if (options?.icon === "disabled") {
		options.icon = <ToastIcon iconType="disabled" />;
	}

	if (options?.icon === "trash") {
		options.icon = <ToastIcon iconType="trash" />;
	}

	if (options?.toastId && toast.isActive(options.toastId)) {
		toast.update(options.toastId, {
			render: (
				<ToastMessage>
					<p>{text}</p>
				</ToastMessage>
			),
			...options,
		});
	} else {
		toast(
			<ToastMessage>
				<p>{text}</p>
			</ToastMessage>,
			options
		);
	}
}

export async function notifyTogglesStatus(force = false) {
	if (
		!(await shouldNotify()) ||
		(!force && !getSetting("notifyWhenTogglingHints"))
	) {
		return;
	}

	renderToast();

	const autoClose = getSetting("toastDuration");

	if (toast.isActive("toggles")) {
		toast.update("toggles");
	} else {
		toast(<TogglesStatusMessage />, { autoClose, toastId: "toggles" });
	}
}
