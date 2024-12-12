import { config, dom } from "@fortawesome/fontawesome-svg-core";
import {
	faCircleCheck,
	faCircleExclamation,
	faCircleInfo,
	faMinus,
	faToggleOff,
	faToggleOn,
	faTrash,
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef } from "react";

// Prevent FontAwesome from dynamically adding its styles since we need them in
// shadow root
config.autoAddCss = false;

const icons = {
	info: { icon: faCircleInfo, color: "#0ea5e9" },
	warning: { icon: faTriangleExclamation, color: "#fde047" },
	success: { icon: faCircleCheck, color: "#22c55e" },
	error: { icon: faCircleExclamation, color: "#ef4444" },
	unset: { icon: faMinus, color: "#9ca3af" },
	enabled: { icon: faToggleOn, color: "#22c55e" },
	disabled: { icon: faToggleOff, color: "#404040" },
	trash: { icon: faTrash, color: "#ef4444" },
};

type ToastIconProps = {
	readonly iconType: keyof typeof icons;
};

export function ToastIcon({ iconType }: ToastIconProps) {
	const iconRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const element = iconRef.current;
		if (!element) return;

		const shadowRoot = element.getRootNode() as ShadowRoot;
		if (shadowRoot && !shadowRoot.querySelector("#fa-styles")) {
			const faStyle = document.createElement("style");
			faStyle.id = "fa-styles";
			faStyle.textContent = dom.css();
			shadowRoot.prepend(faStyle);
		}
	}, []);

	const faIcon = icons[iconType].icon;
	const color = icons[iconType].color;

	return (
		<span ref={iconRef}>
			<FontAwesomeIcon icon={faIcon} size="xl" style={{ color }} />
		</span>
	);
}
