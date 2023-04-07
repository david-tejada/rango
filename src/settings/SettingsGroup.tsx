import "./SettingsGroup.css";

type SettingsGroupProps = {
	label: string;
	children: React.ReactNode;
};

export function SettingsGroup({ label, children }: SettingsGroupProps) {
	return (
		<div className="SettingsGroup">
			<h2>{label}</h2>
			{children}
		</div>
	);
}
