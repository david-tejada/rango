import {
	faCircleCheck,
	faCircleExclamation,
	faCircleInfo,
	faMinus,
	faToggleOff,
	faToggleOn,
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Alert.css";

const icons = {
	info: faCircleInfo,
	warning: faTriangleExclamation,
	success: faCircleCheck,
	error: faCircleExclamation,
	unset: faMinus,
	enabled: faToggleOn,
	disabled: faToggleOff,
};

type AlertProps = {
	readonly type: keyof typeof icons;
	readonly children?: React.ReactNode;
	readonly elementId?: string;
};

export function Alert({ type, children, elementId }: AlertProps) {
	const faIcon = icons[type];

	return (
		<div
			className={`Alert ${type}`}
			aria-labelledby={elementId}
			role={`${type}` === "info" ? "status" : "alert"}
		>
			<FontAwesomeIcon className="icon" icon={faIcon} />
			<p>{children}</p>
		</div>
	);
}
