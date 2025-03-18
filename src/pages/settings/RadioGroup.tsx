import { createContext, type ReactNode, useContext, useMemo, useId } from "react";
import "./RadioGroup.css";

type TypeRadioContext = {
	name: string;
	selectedValue: string;
	isDisabled?: boolean;
	onChange(value: string): void;
};

const RadioContext = createContext<TypeRadioContext>({
	name: "",
	selectedValue: "",
	isDisabled: false,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onChange() {},
});

type RadioProps = {
	readonly value: string;
	readonly children: ReactNode;
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
	readonly label: string;
	readonly name: string;
	readonly defaultValue: T;
	readonly isDisabled?: boolean;
	readonly children: ReactNode;
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
	const id = useId();

	return (
		<RadioContext.Provider value={contextValue}>
			<div className={`RadioGroup ${isDisabled ? "disabled" : ""}`}
				role="radiogroup"
				aria-labelledby={id}>
				<label id={id}>{label}</label>
				<div className="options">{children}</div>
			</div>
		</RadioContext.Provider>
	);
}
