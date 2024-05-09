import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import Color from "color";
import { defaultSettingsMutable, isValidSetting } from "../common/settings";
import { retrieveSettings, store } from "../common/storage";
import { StorageSchema } from "../typings/StorageSchema";
import { hasMatchingKeys } from "../lib/utils";
import { SettingsGroup } from "./SettingsGroup";
import { Toggle } from "./Toggle";
import { NumberInput } from "./NumberInput";
import { Radio, RadioGroup } from "./RadioGroup";
import { SettingRow } from "./SettingRow";
import { TextInput } from "./TextInput";
import { Option, Select } from "./Select";
import { Alert } from "./Alert";
import { ExcludeKeysSetting } from "./ExcludeKeysSetting";
import { CustomHintsSetting } from "./CustomHintsSetting";

let justSaved = false;

export function SettingsComponent() {
	const [storedSettings, setStoredSettings] = useState(defaultSettingsMutable);
	const [settings, setSettings] = useState(defaultSettingsMutable);
	const [loading, setLoading] = useState(true);

	// Using useEffect so it only runs once
	useEffect(() => {
		void retrieveSettings().then((settings) => {
			setStoredSettings(settings);
			setSettings(settings);
			setLoading(false);
		});

		browser.storage.onChanged.addListener((changes) => {
			if (hasMatchingKeys(defaultSettingsMutable, changes) && !justSaved) {
				void retrieveSettings().then((settings) => {
					setStoredSettings(settings);
					setSettings(settings);
				});
			}
		});
	}, []);

	const handleChange = <T extends keyof StorageSchema>(
		key: T,
		value: StorageSchema[T]
	) => {
		setSettings((previousSettings) => ({ ...previousSettings, [key]: value }));

		if (isValidSetting(key, value)) {
			setStoredSettings((previousSettings) => ({
				...previousSettings,
				[key]: value,
			}));

			justSaved = true;
			setTimeout(() => {
				justSaved = false;
			}, 1000);
			void store(key, value);
		}
	};

	const handleBlur = () => {
		setSettings(storedSettings);
	};

	if (loading) return <div />;

	return (
		<div className="Settings">
			<SettingsGroup label="General">
				<SettingRow>
					<Toggle
						label="Always compute hintable elements"
						isPressed={settings.alwaysComputeHintables}
						onClick={() => {
							handleChange(
								"alwaysComputeHintables",
								!settings.alwaysComputeHintables
							);
						}}
					>
						<p className="explanation">
							Always compute what elements should be hinted even if the hints
							are toggled off. This makes switching hints on quicker.
						</p>
					</Toggle>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Show What's New page after updating"
						isPressed={settings.showWhatsNewPageOnUpdate}
						onClick={() => {
							handleChange(
								"showWhatsNewPageOnUpdate",
								!settings.showWhatsNewPageOnUpdate
							);
						}}
					/>
				</SettingRow>
				<SettingRow>
					<RadioGroup
						label="New tab position"
						name="newTabPosition"
						defaultValue={settings.newTabPosition}
						onChange={(value) => {
							handleChange("newTabPosition", value);
						}}
					>
						<Radio value="relatedAfterCurrent">
							Related after current
							<p className="small">
								Open new tabs next to the last tab that was opened from the
								current tab or next to the current tab if no previous tab was
								opened from the current tab.
							</p>
						</Radio>
						<Radio value="afterCurrent">
							After current
							<p className="small">Open new tabs next to the current tab.</p>
						</Radio>
						<Radio value="atEnd">
							At end
							<p className="small">Open all tabs at the end of the tabstrip.</p>
						</Radio>
					</RadioGroup>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Direct clicking">
				<SettingRow>
					<Toggle
						label="Direct clicking available with no focused document"
						isPressed={settings.directClickWithNoFocusedDocument}
						onClick={() => {
							handleChange(
								"directClickWithNoFocusedDocument",
								!settings.directClickWithNoFocusedDocument
							);
						}}
					>
						<p className="explanation">
							Direct clicking will be available even when the page is not in
							focus, for example, when focused in the address bar or the
							devtools.
						</p>
					</Toggle>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Direct clicking available when editing text"
						isPressed={settings.directClickWhenEditing}
						onClick={() => {
							handleChange(
								"directClickWhenEditing",
								!settings.directClickWhenEditing
							);
						}}
					>
						<p className="explanation">
							Direct clicking will be available even when the focus is in an
							input field, textarea or similar.
						</p>
					</Toggle>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Keyboard clicking">
				<SettingRow>
					<Toggle
						label="Keyboard clicking"
						isPressed={settings.keyboardClicking}
						onClick={() => {
							handleChange("keyboardClicking", !settings.keyboardClicking);
						}}
					>
						<p className="explanation">
							Be able to click elements by typing the hint letters.
						</p>
					</Toggle>
				</SettingRow>
				<SettingRow>
					<ExcludeKeysSetting
						value={settings.keysToExclude}
						onChange={(value) => {
							handleChange("keysToExclude", value);
						}}
					/>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Title decorators">
				<SettingRow>
					<Toggle
						label="Include URL in title"
						isPressed={settings.urlInTitle}
						onClick={() => {
							handleChange("urlInTitle", !settings.urlInTitle);
						}}
					/>
				</SettingRow>

				<SettingRow>
					<Toggle
						label="Include tab marker in title"
						isPressed={settings.includeTabMarkers}
						onClick={() => {
							handleChange("includeTabMarkers", !settings.includeTabMarkers);
						}}
					/>
				</SettingRow>

				<SettingRow>
					<Toggle
						label="Hide tab markers with global hints toggle off"
						isPressed={settings.hideTabMarkersWithGlobalHintsOff}
						onClick={() => {
							handleChange(
								"hideTabMarkersWithGlobalHintsOff",
								!settings.hideTabMarkersWithGlobalHintsOff
							);
						}}
					/>
				</SettingRow>

				<SettingRow>
					<Toggle
						label="Use uppercase tab markers"
						isPressed={settings.uppercaseTabMarkers}
						isDisabled={!settings.includeTabMarkers}
						onClick={() => {
							handleChange(
								"uppercaseTabMarkers",
								!settings.uppercaseTabMarkers
							);
						}}
					/>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Hints appearance">
				<SettingRow>
					<TextInput
						label="Hints to exclude"
						defaultValue={settings.hintsToExclude}
						onChange={(value) => {
							handleChange("hintsToExclude", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Use numbers for hints"
						isPressed={settings.useNumberHints}
						isDisabled={settings.keyboardClicking}
						onClick={() => {
							handleChange("useNumberHints", !settings.useNumberHints);
						}}
					>
						{settings.keyboardClicking && (
							<p className="explanation">
								This setting is disabled while keyboard clicking is enabled.
							</p>
						)}
					</Toggle>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Include single letter hints"
						isPressed={settings.includeSingleLetterHints}
						isDisabled={settings.keyboardClicking || settings.useNumberHints}
						onClick={() => {
							handleChange(
								"includeSingleLetterHints",
								!settings.includeSingleLetterHints
							);
						}}
					>
						{settings.keyboardClicking && (
							<p className="explanation">
								This setting is disabled while keyboard clicking is enabled.
								Hints must consist of two letters so all are keyboard reachable.
							</p>
						)}
						{settings.useNumberHints && !settings.keyboardClicking && (
							<p className="explanation">
								This setting is disabled when using numbered hints.
							</p>
						)}
					</Toggle>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Use uppercase letters"
						isPressed={settings.hintUppercaseLetters}
						isDisabled={settings.useNumberHints && !settings.keyboardClicking}
						onClick={() => {
							handleChange(
								"hintUppercaseLetters",
								!settings.hintUppercaseLetters
							);
						}}
					/>
					{settings.useNumberHints && !settings.keyboardClicking && (
						<p className="explanation">
							This setting is disabled when using numbered hints.
						</p>
					)}
				</SettingRow>
				<SettingRow>
					<NumberInput
						label="Viewport margin (px)"
						defaultValue={settings.viewportMargin}
						min={0}
						max={2000}
						isValid={isValidSetting("viewportMargin", settings.viewportMargin)}
						onChange={(value) => {
							handleChange("viewportMargin", value);
						}}
						onBlur={handleBlur}
					/>
					<p className="explanation">
						Determines the area outside of the viewport where hints will be
						drawn. A large number provides a better experience when scrolling
						while a small number will make it more likely to show high priority
						hints (single letters or low numbers).
					</p>
				</SettingRow>
				<SettingRow>
					<TextInput
						label="Font family"
						defaultValue={settings.hintFontFamily}
						onChange={(value) => {
							handleChange("hintFontFamily", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>

				<SettingRow>
					<NumberInput
						label="Font size (px)"
						defaultValue={settings.hintFontSize}
						min={6}
						max={72}
						isValid={isValidSetting("hintFontSize", settings.hintFontSize)}
						onChange={(value) => {
							handleChange("hintFontSize", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>
				<SettingRow>
					<RadioGroup
						label="Font weight"
						name="hintWeight"
						defaultValue={settings.hintWeight}
						onChange={(value) => {
							handleChange("hintWeight", value);
						}}
					>
						<Radio value="auto">
							auto
							<p className="small">
								The font weight is automatically selected for each hint
								depending on contrast and font size
							</p>
						</Radio>
						<Radio value="normal">normal</Radio>
						<Radio value="bold">bold</Radio>
					</RadioGroup>
				</SettingRow>
				<SettingRow>
					<NumberInput
						label="Minimum contrast ratio"
						defaultValue={settings.hintMinimumContrastRatio}
						min={2.5}
						max={21}
						step={0.5}
						isValid={isValidSetting(
							"hintMinimumContrastRatio",
							settings.hintMinimumContrastRatio
						)}
						onChange={(value) => {
							handleChange("hintMinimumContrastRatio", value);
						}}
						onBlur={handleBlur}
					>
						<p className="small show-on-focus">
							Value between 2.5 and 21. Lower values will make hints match the
							style of the page better while higher values provide improved
							legibility.
						</p>
					</NumberInput>
				</SettingRow>
				<SettingRow>
					<TextInput
						label="Background color"
						defaultValue={settings.hintBackgroundColor}
						isValid={isValidSetting(
							"hintBackgroundColor",
							settings.hintBackgroundColor
						)}
						onChange={(value) => {
							handleChange("hintBackgroundColor", value);
						}}
						onBlur={handleBlur}
					>
						<p className="small show-on-focus">
							Use a{" "}
							<a
								href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value"
								target="_blank"
								rel="noreferrer"
							>
								CSS color string
							</a>
							. Newer color formats like LCH might not be supported. Leaving the
							field blank lets the color be determined based on the element
							being hinted.
						</p>
					</TextInput>
				</SettingRow>
				<SettingRow>
					<TextInput
						label="Font/border color"
						defaultValue={settings.hintFontColor}
						isValid={isValidSetting("hintFontColor", settings.hintFontColor)}
						onChange={(value) => {
							handleChange("hintFontColor", value);
						}}
						onBlur={handleBlur}
					>
						{!storedSettings.hintBackgroundColor && settings.hintFontColor && (
							<Alert type="warning">
								No background color set. This value will be ignored.
							</Alert>
						)}
						<p className="small show-on-focus">
							Use a{" "}
							<a
								href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value"
								target="_blank"
								rel="noreferrer"
							>
								CSS color string
							</a>
							. Newer color formats like LCH might not be supported. Leaving the
							field blank lets the color be determined based on the element
							being hinted and the background color.
						</p>
					</TextInput>
				</SettingRow>

				<SettingRow>
					<NumberInput
						label="Background opacity"
						defaultValue={settings.hintBackgroundOpacity}
						min={0}
						max={1}
						step={0.05}
						isValid={isValidSetting(
							"hintBackgroundOpacity",
							settings.hintBackgroundOpacity
						)}
						isDisabled={
							Boolean(storedSettings.hintBackgroundColor) &&
							new Color(storedSettings.hintBackgroundColor).alpha() !== 1
						}
						onChange={(value) => {
							handleChange("hintBackgroundOpacity", value);
						}}
						onBlur={handleBlur}
					>
						<p className="small show-on-focus">
							Choose a value between 0 (fully transparent) and 1 (fully opaque).
						</p>
						{storedSettings.hintBackgroundColor &&
							new Color(storedSettings.hintBackgroundColor).alpha() !== 1 && (
								<p className="small">
									The chosen background color already has an alpha channel. This
									value will be ignored.
								</p>
							)}
					</NumberInput>
				</SettingRow>
				<SettingRow>
					<NumberInput
						label="Border width (px)"
						defaultValue={settings.hintBorderWidth}
						min={0}
						max={72}
						isValid={isValidSetting(
							"hintBorderWidth",
							settings.hintBorderWidth
						)}
						onChange={(value) => {
							handleChange("hintBorderWidth", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>
				<SettingRow>
					<NumberInput
						label="Border radius (px)"
						defaultValue={settings.hintBorderRadius}
						min={0}
						max={72}
						isValid={isValidSetting(
							"hintBorderRadius",
							settings.hintBorderRadius
						)}
						onChange={(value) => {
							handleChange("hintBorderRadius", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Custom Hints">
				<SettingRow>
					<CustomHintsSetting
						value={settings.customSelectors}
						onChange={(value) => {
							handleChange("customSelectors", value);
						}}
					/>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Scroll">
				<SettingRow>
					<RadioGroup
						label="Scroll behavior"
						name="scrollBehavior"
						defaultValue={settings.scrollBehavior}
						onChange={(value) => {
							handleChange("scrollBehavior", value);
						}}
					>
						<Radio value="auto">
							auto
							<p className="small">
								Follows the{" "}
								<a
									href="https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion#user_preferences"
									target="_blank"
									rel="noreferrer"
								>
									OS setting for reduced motion.
								</a>{" "}
							</p>
						</Radio>
						<Radio value="smooth">smooth</Radio>
						<Radio value="instant">instant</Radio>
					</RadioGroup>
				</SettingRow>
			</SettingsGroup>
			<SettingsGroup label="Notifications">
				<SettingRow>
					<Toggle
						label="Enable notifications"
						isPressed={settings.enableNotifications}
						onClick={() => {
							handleChange(
								"enableNotifications",
								!settings.enableNotifications
							);
						}}
					/>
				</SettingRow>
				<SettingRow>
					<Select
						label="Position"
						defaultValue={settings.toastPosition}
						isDisabled={!settings.enableNotifications}
						onChange={(value) => {
							handleChange("toastPosition", value);
						}}
					>
						<Option value="top-left">top-left</Option>
						<Option value="top-center">top-center</Option>
						<Option value="top-right">top-right</Option>
						<Option value="bottom-left">bottom-left</Option>
						<Option value="bottom-center">bottom-center</Option>
						<Option value="bottom-right">bottom-right</Option>
					</Select>
				</SettingRow>

				<SettingRow>
					<NumberInput
						label="Duration (ms)"
						defaultValue={settings.toastDuration}
						isValid={isValidSetting("toastDuration", settings.toastDuration)}
						onChange={(value) => {
							handleChange("toastDuration", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>

				<SettingRow>
					<RadioGroup
						label="Transition"
						name="toastTransition"
						defaultValue={settings.toastTransition}
						isDisabled={!settings.enableNotifications}
						onChange={(value) => {
							handleChange("toastTransition", value);
						}}
					>
						<Radio value="bounce">bounce</Radio>
						<Radio value="slide">slide</Radio>
						<Radio value="flip">flip</Radio>
						<Radio value="zoom">zoom</Radio>
					</RadioGroup>
				</SettingRow>
			</SettingsGroup>
		</div>
	);
}
