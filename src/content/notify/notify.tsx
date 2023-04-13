import { ToastOptions, toast } from "react-toastify";
import { createRoot } from "react-dom/client";
import { getCachedSetting } from "../settings/cacheSettings";
import { isCurrentTab, isMainframe } from "../setup/contentScriptContext";
import { Toast } from "./Toast";
import { ToastMessage } from "./ToastMessage";
import { TogglesStatusMessage } from "./ToastTogglesMessage";
import { ToastIcon } from "./ToastIcon";

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
		document.visibilityState !== "visible" ||
		!getCachedSetting("enableNotifications") ||
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

	if (options?.icon === "enabled") {
		options.icon = <ToastIcon iconType="enabled" />;
	}

	if (options?.icon === "disabled") {
		options.icon = <ToastIcon iconType="disabled" />;
	}

	if (options?.toastId && toast.isActive(options.toastId)) {
		toast.update(options.toastId, {
			render: <ToastMessage text={text} />,
			...options,
		});
	} else {
		toast(<ToastMessage text={text} />, options);
	}
}

export async function notifyTogglesStatus() {
	if (!(await shouldNotify())) return;

	renderToast();

	if (toast.isActive("toggles")) {
		toast.update("toggles");
	} else {
		toast(<TogglesStatusMessage />, { toastId: "toggles" });
	}
}
