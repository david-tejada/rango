import { createRoot, type Root } from "react-dom/client";
import { toast } from "react-toastify";
import {
	createNotifier,
	type NotificationType,
} from "../../common/createNotifier";
import { createElement } from "../dom/utils";
import { settingsSync } from "../settings/settingsSync";
import { isCurrentTab, isMainFrame } from "../setup/contentScriptContext";
import { Toast } from "./toast/Toast";
import toastCSS from "./toast/toastCss";
import { ToastIcon } from "./toast/ToastIcon";
import toastifyCSS from "./toast/toastifyCss";
import { ToastMessage } from "./toast/ToastMessage";
import toastTogglesCSS from "./toast/toastTogglesCss";
import { TogglesStatusMessage } from "./toast/ToastTogglesMessage";

/**
 * Display a toast notification with the given text.
 */
export const notify = createNotifier(
	async (text: string, type: NotificationType, toastId?: string) => {
		if (!(await shouldNotify())) return;

		renderToast();
		const autoClose = settingsSync.get("toastDuration");

		const icon = <ToastIcon iconType={type} />;

		if (toastId && toast.isActive(toastId)) {
			toast.update(toastId, {
				render: (
					<ToastMessage>
						<p>{text}</p>
					</ToastMessage>
				),
				icon,
			});
			return;
		}

		toast(
			<ToastMessage>
				<p>{text}</p>
			</ToastMessage>,
			{ icon, autoClose, toastId }
		);
	}
);

let toastRoot: Root | undefined;

function renderToast() {
	let shadowHost = document.querySelector("#rango-toast");

	if (shadowHost && toastRoot) {
		return;
	}

	if (!shadowHost) {
		shadowHost = createElement("div", { id: "rango-toast" });
		const shadowRoot = shadowHost.attachShadow({ mode: "open" });

		shadowRoot.append(
			createElement("style", {
				id: "toastify-styles",
				textContent: toastifyCSS,
			}),
			createElement("style", {
				id: "toast-styles",
				textContent: toastCSS,
			}),
			createElement("style", {
				id: "toast-toggles-styles",
				textContent: toastTogglesCSS,
			})
		);

		document.body.append(shadowHost);
	}

	const shadowRoot = shadowHost.shadowRoot;
	if (shadowRoot) {
		toastRoot = createRoot(shadowRoot);
		toastRoot.render(<Toast />);
	}
}

async function shouldNotify() {
	if (
		document.visibilityState !== "visible" ||
		!settingsSync.get("enableNotifications") ||
		!isMainFrame() ||
		!(await isCurrentTab())
	) {
		return false;
	}

	return true;
}

/**
 * Display a toast notification showing the toggle levels and their status.
 *
 * @param force - If `true`, the notification will be always displayed, no matter
 * what the notification settings are.
 */
export async function notifyTogglesStatus(force = false) {
	if (
		!force &&
		!((await shouldNotify()) && settingsSync.get("notifyWhenTogglingHints"))
	) {
		return;
	}

	renderToast();

	const autoClose = settingsSync.get("toastDuration");

	if (toast.isActive("toggles")) {
		toast.update("toggles");
		return;
	}

	toast(<TogglesStatusMessage />, { autoClose, toastId: "toggles" });
}
