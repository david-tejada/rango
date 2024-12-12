import * as toastCSS from "bundle-text:./toast/Toast.css";
import * as toastifyCSS from "bundle-text:./toast/toastify.css";
import * as toastTogglesCSS from "bundle-text:./toast/ToastTogglesMessage.css";
import { createRoot } from "react-dom/client";
import { type ToastOptions, toast } from "react-toastify";
import { createElement } from "../dom/utils";
import { getSetting } from "../settings/settingsManager";
import { isCurrentTab, isMainFrame } from "../setup/contentScriptContext";
import { Toast } from "./toast/Toast";
import { ToastIcon } from "./toast/ToastIcon";
import { ToastMessage } from "./toast/ToastMessage";
import { TogglesStatusMessage } from "./toast/ToastTogglesMessage";

function renderToast() {
	let shadowHost = document.querySelector("#rango-toast");

	if (!shadowHost) {
		const toastifyStyles = createElement("style", {
			id: "toastify-styles",
			textContent: toastifyCSS,
		});

		const toastStyles = createElement("style", {
			id: "toast-styles",
			textContent: toastCSS,
		});

		const toastTogglesStyles = createElement("style", {
			id: "toast-toggles-styles",
			textContent: toastTogglesCSS,
		});

		shadowHost = createElement("div", {
			id: "rango-toast",
		});
		const shadowRoot = shadowHost.attachShadow({ mode: "open" });
		shadowRoot.append(toastifyStyles, toastStyles, toastTogglesStyles);

		createRoot(shadowRoot).render(<Toast />);
		document.body.append(shadowHost);
	}
}

async function shouldNotify() {
	if (
		document.visibilityState !== "visible" ||
		!getSetting("enableNotifications") ||
		!isMainFrame() ||
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

export async function notifyTogglesStatus() {
	if (!((await shouldNotify()) && getSetting("notifyWhenTogglingHints"))) {
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
