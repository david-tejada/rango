import { type ReactNode } from "react";
import { useId } from "react";
import "./Select.css";

type OptionProps = {
	readonly value: string;
	readonly children: ReactNode;
};

export function Option({ value, children }: OptionProps) {
	return <option value={value}>{children}</option>;
}

type SelectProps<T extends string> = {
	readonly label: string;
	readonly defaultValue: T;
	readonly children: ReactNode;
	readonly isDisabled: boolean;
	onChange(value: T): void;
};

export function Select<T extends string>({
	label,
	defaultValue,
	isDisabled,
	onChange,
	children,
}: SelectProps<T>) {
	const id = useId();
	
	return (
		<div className={`Select ${isDisabled ? "disabled" : ""}`}>
			<label htmlFor={id}>{label}</label>
			<select
				id={id}
				value={defaultValue}
				disabled={isDisabled}
				onChange={(event) => {
					onChange(event.target.value as T);
				}}
			>
				{children}
			</select>
		</div>
	);
}
