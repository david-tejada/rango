import { createContext, ReactNode, useContext, useMemo } from "react";
import "./RadioGroup.css";

type TRadioContext = {
	name: string;
	selectedValue: string;
	onChange(value: string): void;
};

const RadioContext = createContext<TRadioContext>({
	name: "",
	selectedValue: "",
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onChange() {},
});

type RadioProps = {
	value: string;
	children: ReactNode;
};

export function Radio({ value, children }: RadioProps) {
	const { name, selectedValue, onChange } = useContext(RadioContext);

	return (
		<div className="Radio">
			<input
				type="radio"
				name={name}
				id={name}
				value={value}
				checked={value === selectedValue}
				onChange={() => {
					onChange(value);
				}}
			/>
			<label htmlFor={name}>{children}</label>
		</div>
	);
}

type RadioGroupProps<T extends string> = {
	label: string;
	name: string;
	defaultValue: T;
	children: ReactNode;
	onChange(value: T): void;
};

export function RadioGroup<T extends string>({
	label,
	name,
	defaultValue,
	onChange,
	children,
}: RadioGroupProps<T>) {
	const contextValue = useMemo(
		() => ({ name, selectedValue: defaultValue, onChange }),
		[name, defaultValue, onChange]
	);

	return (
		<RadioContext.Provider value={contextValue}>
			<div className="RadioGroup">
				{label}
				<div className="options">{children}</div>
			</div>
		</RadioContext.Provider>
	);
}
