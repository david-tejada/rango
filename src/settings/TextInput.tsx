import { useId } from "react";
import "./Input.css";

type InputProps = {
	label: string;
	defaultValue: string | number;
	isValid?: boolean;
	children?: React.ReactNode;
	onChange(value: string): void;
	onBlur?(): void;
};

export function TextInput({
	label,
	defaultValue,
	isValid: valid,
	onChange,
	onBlur,
	children,
}: InputProps) {
	const id = useId();

	return (
		<div className="Input">
			<label htmlFor={id}>{label}</label>
			<div>
				<input
					value={defaultValue}
					id={id}
					type="text"
					data-is-valid={valid}
					onChange={(event) => {
						onChange(event.target.value);
					}}
					onBlur={(event) => {
						event.target.classList.remove("valid", "invalid");
						if (onBlur) onBlur();
					}}
				/>
				{children}
			</div>
		</div>
	);
}
