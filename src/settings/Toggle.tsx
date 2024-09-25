import "./Toggle.css";

type ToggleProps = {
	readonly label: string;
	readonly isPressed: boolean;
	readonly isDisabled?: boolean;
	readonly children?: React.ReactNode;
	onClick(): void;
};

export function Toggle({
	label,
	isPressed,
	isDisabled,
	children,
	onClick,
}: ToggleProps) {
	return (
		<div className={`Toggle ${isDisabled ? "disabled" : ""}`}>
			<label>
				{label}
				<button
					type="button"
					disabled={isDisabled}
					aria-pressed={isPressed}
					onClick={onClick}
				/>
			</label>
			{children}
		</div>
	);
}
