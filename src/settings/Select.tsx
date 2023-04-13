import { ReactNode } from "react";
import "./Select.css";

type OptionProps = {
	value: string;
	children: ReactNode;
};

export function Option({ value, children }: OptionProps) {
	return <option value={value}>{children}</option>;
}

type SelectProps<T extends string> = {
	label: string;
	defaultValue: T;
	children: ReactNode;
	isDisabled: boolean;
	onChange(value: T): void;
};

export function Select<T extends string>({
	label,
	defaultValue,
	isDisabled,
	onChange,
	children,
}: SelectProps<T>) {
	return (
		<div className={`Select ${isDisabled ? "disabled" : ""}`}>
			{label}
			<select
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
