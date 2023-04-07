import { ChangeEvent, useId } from "react";
import "./Input.css";

function parseNumber(numberString: string) {
	if (numberString === "") return Number.NaN;
	return Number(numberString);
}

type InputProps = {
	label: string;
	defaultValue: number;
	step?: number;
	min?: number;
	max?: number;
	isDisabled?: boolean;
	isValid?: boolean;
	children?: React.ReactNode;
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
	onChange,
	onBlur,
	children,
}: InputProps) {
	const id = useId();

	const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		const numberValue = parseNumber(event.target.value);

		onChange(numberValue);
	};

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
				{children}
			</div>
		</div>
	);
}
