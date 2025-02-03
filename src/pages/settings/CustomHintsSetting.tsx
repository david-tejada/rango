import { faBan, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isValidRegExp } from "../../common/isValidRegExp";
import { isValidSelector } from "../../common/isValidSelector";
import { type CustomSelector } from "../../common/settings/settingsSchema";
import "./CustomHintsSetting.css";

type CustomHintsSettingProps = {
	readonly value: CustomSelector[];
	onChange(value: CustomSelector[]): void;
};

export function CustomHintsSetting({
	value,
	onChange,
}: CustomHintsSettingProps) {
	function handleChange(
		event: React.ChangeEvent<HTMLInputElement>,
		key: "pattern" | "selector",
		index: number
	) {
		const result = value.map((entry, i) => {
			if (i === index) {
				return { ...entry, [key]: event.target.value };
			}

			return entry;
		});

		onChange(result);
	}

	function handleNewItem(type: "include" | "exclude") {
		const newItem = { type, pattern: "", selector: "" };
		onChange([...value, newItem]);
	}

	function handleDeletion(index: number) {
		const filtered = value.filter((_, i) => i !== index);
		onChange(filtered);
	}

	return (
		<div className="CustomHintsSetting">
			{value.length > 0 && (
				<div className="row header">
					<p>Pattern</p>
					<p>Selector</p>
				</div>
			)}

			{value.map(({ type, pattern, selector }, index) => (
				// eslint-disable-next-line react/no-array-index-key
				<div key={index} className="row">
					{type === "include" ? (
						<FontAwesomeIcon
							icon={faPlus}
							size="lg"
							style={{ color: "#22c55e", marginRight: "0.25em" }}
						/>
					) : (
						<FontAwesomeIcon icon={faBan} style={{ color: "#ef4444" }} />
					)}
					<input
						autoFocus={
							index === value.length - 1 && pattern === "" && selector === ""
						}
						type="text"
						name="pattern"
						aria-label="pattern"
						value={pattern}
						data-is-valid={isValidRegExp(pattern)}
						onChange={(event) => {
							handleChange(event, "pattern", index);
						}}
					/>
					<input
						type="text"
						name="selector"
						aria-label="selector"
						value={selector}
						data-is-valid={selector && isValidSelector(selector)}
						onChange={(event) => {
							handleChange(event, "selector", index);
						}}
					/>
					<button
						type="button"
						aria-label="delete"
						onClick={() => {
							handleDeletion(index);
						}}
					>
						<FontAwesomeIcon icon={faTrash} style={{ color: "#ef4444" }} />
					</button>
				</div>
			))}
			<div className="row">
				<button
					className="button-add"
					type="button"
					onClick={() => {
						handleNewItem("include");
					}}
				>
					<FontAwesomeIcon
						icon={faPlus}
						size="lg"
						style={{ color: "#22c55e", marginRight: "0.25em" }}
					/>
					Add selector to include
				</button>
				<button
					className="button-add"
					type="button"
					onClick={() => {
						handleNewItem("exclude");
					}}
				>
					<FontAwesomeIcon
						icon={faBan}
						size="lg"
						style={{ color: "#ef4444", marginRight: "0.25em" }}
					/>
					Add selector to exclude
				</button>
			</div>
		</div>
	);
}
