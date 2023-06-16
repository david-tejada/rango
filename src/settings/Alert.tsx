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
	type: keyof typeof icons;
	children?: React.ReactNode;
};

export function Alert({ type, children }: AlertProps) {
	const faIcon = icons[type];

	return (
		<div className={`Alert ${type}`}>
			<FontAwesomeIcon className="icon" icon={faIcon} />
			<p>{children}</p>
		</div>
	);
}
