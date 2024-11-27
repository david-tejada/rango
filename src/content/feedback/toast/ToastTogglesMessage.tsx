import { getToggles } from "../../settings/toggles";
import { ToastIcon } from "./ToastIcon";
import { ToastMessage } from "./ToastMessage";
import "./ToastTogglesMessage.css";

function getIconType(value: boolean | undefined) {
	if (value === undefined) return "unset";
	return value ? "enabled" : "disabled";
}

type ToggleStatusProps = {
	readonly label: string;
	readonly status: boolean | undefined;
};

function ToggleStatus({ label, status }: ToggleStatusProps) {
	return (
		<div className={`ToggleStatus ${status === undefined ? "unset" : "set"}`}>
			{label}
			<ToastIcon iconType={getIconType(status)} />
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
