import { createContext, ReactNode, useContext, useMemo } from "react";
import "./RadioGroup.css";

type TRadioContext = {
	name: string;
	selectedValue: string;
	isDisabled?: boolean;
	onChange(value: string): void;
};

const RadioContext = createContext<TRadioContext>({
	name: "",
	selectedValue: "",
	isDisabled: false,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onChange() {},
});

type RadioProps = {
	value: string;
	children: ReactNode;
};

export function Radio({ value, children }: RadioProps) {
	const { name, selectedValue, isDisabled, onChange } =
		useContext(RadioContext);

	return (
		<label className="Radio" htmlFor={`${name}-${value}`}>
			<input
				type="radio"
				name={name}
				id={`${name}-${value}`}
				value={value}
				disabled={isDisabled}
				checked={value === selectedValue}
				onChange={() => {
					onChange(value);
				}}
			/>
			<div className="body">{children}</div>
		</label>
	);
}

type RadioGroupProps<T extends string> = {
	label: string;
	name: string;
	defaultValue: T;
	isDisabled?: boolean;
	children: ReactNode;
	onChange(value: T): void;
};

export function RadioGroup<T extends string>({
	label,
	name,
	defaultValue,
	isDisabled,
	onChange,
	children,
}: RadioGroupProps<T>) {
	const contextValue = useMemo(
		() => ({ name, selectedValue: defaultValue, isDisabled, onChange }),
		[name, defaultValue, isDisabled, onChange]
	);

	return (
		<RadioContext.Provider value={contextValue}>
			<div className={`RadioGroup ${isDisabled ? "disabled" : ""}`}>
				{label}
				<div className="options">{children}</div>
			</div>
		</RadioContext.Provider>
	);
}
