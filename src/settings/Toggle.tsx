import "./Toggle.css";

type ToggleProps = {
	label: string;
	isPressed: boolean;
	isDisabled?: boolean;
	onClick(): void;
};

export function Toggle({ label, isPressed, isDisabled, onClick }: ToggleProps) {
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
		</div>
	);
}
