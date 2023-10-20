import {
	faCircleCheck,
	faCircleExclamation,
	faCircleInfo,
	faMinus,
	faToggleOff,
	faToggleOn,
	faTriangleExclamation,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
	iconType: keyof typeof icons;
};

export function ToastIcon({ iconType }: ToastIconProps) {
	const faIcon = icons[iconType].icon;
	const color = icons[iconType].color;

	return <FontAwesomeIcon icon={faIcon} size="xl" style={{ color }} />;
}
