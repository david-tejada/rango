import { faBan, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CustomSelectorsForPattern } from "../typings/StorageSchema";
import "./CustomHintsSetting.css";
import { isValidSelector } from "../content/utils/selectorUtils";
import { isValidRegExp } from "../content/utils/textUtils";

type CustomHintsMap = Map<string, CustomSelectorsForPattern>;
type CustomHintsArray = Array<{
	type: "include" | "exclude";
	pattern: string;
	selector: string;
}>;

type CustomHintsSettingProp = {
	value: CustomHintsMap;
	onChange(value: CustomHintsMap): void;
};

function flattenCustomHints(customHints: CustomHintsMap) {
	const result: CustomHintsArray = [];
	for (const [pattern, { include, exclude }] of customHints.entries()) {
		for (const selector of include) {
			result.push({ type: "include", pattern, selector });
		}

		for (const selector of exclude) {
			result.push({ type: "exclude", pattern, selector });
		}
	}

	return result;
}

function flatCustomHintsToMap(flatCustomHints: CustomHintsArray) {
	const result: CustomHintsMap = new Map();

	for (const { type, pattern, selector } of flatCustomHints) {
		const customForPattern = result.get(pattern) ?? {
			include: [],
			exclude: [],
		};
		if (type === "include") {
			customForPattern.include.push(selector);
		} else {
			customForPattern.exclude.push(selector);
		}

		result.set(pattern, customForPattern);
	}

	return result;
}

export function CustomHintsSetting({
	value,
	onChange,
}: CustomHintsSettingProp) {
	const flatCustomHints = flattenCustomHints(value);

	function handleChange(
		event: React.ChangeEvent<HTMLInputElement>,
		key: "pattern" | "selector",
		index: number
	) {
		const result = flatCustomHints.map((entry, i) => {
			if (i === index) {
				return { ...entry, [key]: event.target.value };
			}

			return entry;
		});

		onChange(flatCustomHintsToMap(result));
	}

	function handleNewItem(type: "include" | "exclude") {
		const newItem = { type, pattern: "", selector: "" };
		onChange(flatCustomHintsToMap([...flatCustomHints, newItem]));
	}

	function handleDeletion(index: number) {
		const filtered = flatCustomHints.filter((_, i) => i !== index);
		onChange(flatCustomHintsToMap(filtered));
	}

	return (
		<div className="CustomHintsSetting">
			{flatCustomHints.length > 0 && (
				<div className="row header">
					<p>Pattern</p>
					<p>Selector</p>
				</div>
			)}

			{flatCustomHints.map(({ type, pattern, selector }, index) => (
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
							index === flatCustomHints.length - 1 &&
							pattern === "" &&
							selector === ""
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
