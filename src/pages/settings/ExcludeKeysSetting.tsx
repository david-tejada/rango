import { useRef } from "react";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./ExcludeKeysSetting.css";

type ExcludeKeysSettingProps = {
	readonly value: Array<[string, string]>;
	onChange(value: Array<[string, string]>): void;
};

export function ExcludeKeysSetting({
	value,
	onChange,
}: ExcludeKeysSettingProps) {
	const addExcludeKeyButtonRef = useRef<HTMLButtonElement>(null);

	function handleChange(
		event: React.ChangeEvent<HTMLInputElement>,
		index: number
	) {
		const result = value.map((value, i) => {
			if (i === index) {
				return (
					event.target.name === "pattern"
						? [event.target.value, value[1]]
						: [value[0], event.target.value]
				) as [string, string];
			}

			return value;
		});

		onChange(result);
	}

	function handleNewItem() {
		value.push(["", ""]);
		onChange(value);
	}

	function handleDeletion(index: number) {
		onChange(value.filter((_, i) => i !== index));
		addExcludeKeyButtonRef.current?.focus();
	}

	return (
		<div className="ExcludeKeysSetting">
			<p>Exclude keys</p>
			<p className="explanation">
				Exclude keys for certain patterns. Patterns are regular expression that
				will be used to match against the URL of the page. You can easily add a
				pattern for the current URL by right clicking on the extension icon and
				selecting <code>Add Keys to Exclude</code>
			</p>
			{value.length > 0 && (
				<div className="row header">
					<p>Pattern</p>
					<p>Keys to exclude</p>
				</div>
			)}

			{value.map((entry, index) => (
				// eslint-disable-next-line react/no-array-index-key
				<div key={index} className="row">
					<input
						autoFocus={index === value.length - 1 && !entry[0] && !entry[1]}
						type="text"
						name="pattern"
						aria-label="pattern"
						value={entry[0]}
						onChange={(event) => {
							handleChange(event, index);
						}}
					/>
					<input
						type="text"
						name="keys"
						aria-label="keys to exclude"
						value={entry[1]}
						onChange={(event) => {
							handleChange(event, index);
						}}
					/>
					<button
						type="button"
						aria-label={
							entry[0] === ""
								? "Delete blank pattern on row " +
									(index + 1) +
									" of " +
									value.length
								: "Delete pattern '" +
									entry[0] +
									"' on row " +
									(index + 1) +
									" of " +
									value.length
						}
						onClick={() => {
							handleDeletion(index);
						}}
					>
						<FontAwesomeIcon
							icon={faTrash}
							size="lg"
							style={{ color: "var(--red-500)" }}
						/>
					</button>
				</div>
			))}
			<button
				ref={addExcludeKeyButtonRef}
				className="button-add"
				type="button"
				aria-label="Add exclude keys pattern"
				onClick={() => {
					handleNewItem();
				}}
			>
				<FontAwesomeIcon
					icon={faPlus}
					size="lg"
					style={{ color: "var(--green-500)", marginRight: "0.25em" }}
				/>
				Add
			</button>
		</div>
	);
}
