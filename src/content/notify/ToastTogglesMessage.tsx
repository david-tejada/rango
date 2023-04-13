import { getToggles } from "../settings/toggles";
import { ToastIcon } from "./ToastIcon";
import "./ToastTogglesMessage.css";

function getIconType(value: boolean | undefined) {
	if (value === undefined) return "unset";
	return value ? "enabled" : "disabled";
}

type ToggleStatusProps = {
	label: string;
	status: boolean | undefined;
	isHeader?: boolean;
};

function ToggleStatus({ label, status, isHeader }: ToggleStatusProps) {
	return (
		<div
			className={`ToggleStatus ${status === undefined ? "unset" : "set"} ${
				isHeader ? "header" : ""
			}`}
		>
			{label}
			<ToastIcon iconType={getIconType(status)} />
		</div>
	);
}

export function TogglesStatusMessage() {
	const { navigation, path, host, tab, global } = getToggles();

	return (
		<div className="TogglesStatusMessage">
			<ToggleStatus label="Now" status={navigation} />
			<ToggleStatus label="Page" status={path} />
			<ToggleStatus label="Host" status={host} />
			<ToggleStatus label="Tab" status={tab} />
			<ToggleStatus label="Global" status={global} />
		</div>
	);
}
