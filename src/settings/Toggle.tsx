import "./Toggle.css";

type ToggleProps = {
	label: string;
	isPressed: boolean;
	onClick(): void;
};

export function Toggle({ label, isPressed, onClick }: ToggleProps) {
	return (
		<div className="Toggle">
			<label>
				{label}
				<button type="button" aria-pressed={isPressed} onClick={onClick} />
			</label>
		</div>
	);
}
