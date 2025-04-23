import { useId } from "react";
import "./Input.css";
import { Alert } from "./Alert";

type InputProps = {
	readonly label: string;
	readonly defaultValue: string | number;
	readonly isValid?: boolean;
	readonly validationMessage?: string;
	readonly isDisabled?: boolean;
	readonly children?: React.ReactNode;
	onChange(value: string): void;
	onBlur?(): void;
};

export function TextInput({
	label,
	defaultValue,
	isValid,
	validationMessage,
	isDisabled,
	onChange,
	onBlur,
	children,
}: InputProps) {
	const id = useId();

	const errorMessage =
		validationMessage === "Invalid input"
			? "Incorrect color string. Use a CSS color string."
			: validationMessage;

	return (
		<div className="Input">
			<label htmlFor={id}>{label}</label>
			<div>
				<input
					value={defaultValue}
					id={id}
					type="text"
					data-is-valid={isValid}
					disabled={isDisabled}
					onChange={(event) => {
						onChange(event.target.value);
					}}
					onBlur={(event) => {
						event.target.classList.remove("valid", "invalid");
						if (onBlur) onBlur();
					}}
				/>
				{!isValid && !isDisabled && (
					<Alert type="error" elementId={id}>
						{errorMessage}
					</Alert>
				)}
				{children}
			</div>
		</div>
	);
}
