import { getToggles } from "../../settings/toggles";
import { ToastIcon } from "./ToastIcon";
import { ToastMessage } from "./ToastMessage";

function getIconType(value: boolean | undefined) {
	if (value === undefined) return "unset";
	return value ? "enabled" : "disabled";
}

type ToggleStatusProps = {
	readonly label: string;
	readonly status: boolean | undefined;
};

function ToggleStatus({ label, status }: ToggleStatusProps) {
	const iconType = getIconType(status);

	return (
		<div className={`ToggleStatus ${status === undefined ? "unset" : "set"}`}>
			{label}
			<span className="sr-only"> hints are{iconType}.</span>
			<ToastIcon iconType={iconType} />
		</div>
	);
}

export function TogglesStatusMessage() {
	const { navigation, path, host, tab, global } = getToggles();

	return (
		<ToastMessage>
			<ToggleStatus label="Now" status={navigation} />
			<ToggleStatus label="Page" status={path} />
			<ToggleStatus label="Host" status={host} />
			<ToggleStatus label="Tab" status={tab} />
			<ToggleStatus label="Global" status={global} />
		</ToastMessage>
	);
}
