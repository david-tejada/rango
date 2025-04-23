import { type ChangeEvent, useId } from "react";
import "./Input.css";
import { Alert } from "./Alert";

function parseNumber(numberString: string) {
	if (numberString === "") return Number.NaN;
	return Number(numberString);
}

type InputProps = {
	readonly label: string;
	readonly defaultValue: number;
	readonly step?: number;
	readonly min?: number;
	readonly max?: number;
	readonly isDisabled?: boolean;
	readonly isValid?: boolean;
	readonly validationMessage?: string;
	readonly children?: React.ReactNode;
	onChange(value: number): void;
	onBlur(): void;
};

export function NumberInput({
	label,
	defaultValue,
	step = 1,
	min,
	max,
	isDisabled,
	isValid,
	validationMessage,
	onChange,
	onBlur,
	children,
}: InputProps) {
	const id = useId();

	const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		const numberValue = parseNumber(event.target.value);

		onChange(numberValue);
	};

	const errorMessage =
		validationMessage === "Expected number, received nan"
			? "This field can't be empty"
			: validationMessage;

	return (
		<div className="Input">
			<label htmlFor={id}>{label}</label>
			<div>
				<input
					value={defaultValue}
					id={id}
					type="number"
					step={step}
					max={max}
					min={min}
					disabled={isDisabled}
					data-is-valid={isValid}
					onChange={onChangeHandler}
					onBlur={() => {
						onBlur();
					}}
				/>
				{!isValid && (
					<Alert type="error" elementId={id}>
						{errorMessage}
					</Alert>
				)}
				{children}
			</div>
		</div>
	);
}
