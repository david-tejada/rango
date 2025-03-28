import Color from "colorjs.io";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { settings } from "../../common/settings/settings";
import { type Settings } from "../../common/settings/settingsSchema";
import { Alert } from "./Alert";
import { CustomHintsSetting } from "./CustomHintsSetting";
import { ExcludeKeysSetting } from "./ExcludeKeysSetting";
import { NumberInput } from "./NumberInput";
import { Radio, RadioGroup } from "./RadioGroup";
import { Option, Select } from "./Select";
import { SettingRow } from "./SettingRow";
import { SettingsGroup } from "./SettingsGroup";
import { TextInput } from "./TextInput";
import { Toggle } from "./Toggle";

let justSaved = false;

const defaultSettings = settings.defaults();

export function SettingsComponent() {
	const [storedSettings, setStoredSettings] = useState(defaultSettings);
	const [dirtySettings, setDirtySettings] = useState(defaultSettings);
	const [loading, setLoading] = useState(true);

	const debounceUpdateSettings = useCallback(() => {
		const update = debounce(() => {
			void settings.getAll().then((settings) => {
				setStoredSettings(settings);
				setDirtySettings(settings);
			});
		}, 10);
		update();
	}, [setStoredSettings, setDirtySettings]);

	useEffect(() => {
		void settings.getAll().then((settings) => {
			setStoredSettings(settings);
			setDirtySettings(settings);
			setLoading(false);
		});

		const unsubscribe = settings.onAnyChange(() => {
			if (!justSaved) debounceUpdateSettings();
		});

		return () => {
			unsubscribe();
		};
	}, [debounceUpdateSettings]);

	const handleChange = <T extends keyof Settings>(
		key: T,
		value: Settings[T]
	) => {
		setDirtySettings((previousSettings) => ({
			...previousSettings,
			[key]: value,
		}));

		if (settings.isValid(key, value)) {
			setStoredSettings((previousSettings) => ({
				...previousSettings,
				[key]: value,
			}));

			justSaved = true;
			setTimeout(() => {
				justSaved = false;
			}, 1000);
			void settings.set(key, value);
		}
	};

	const handleBlur = () => {
		setDirtySettings(storedSettings);
	};

	if (loading) return <div />;

	return (
		<div className="Settings">
			<SettingsGroup label="General">
				<SettingRow>
					<Toggle
						label="Always compute hintable elements"
						isPressed={dirtySettings.alwaysComputeHintables}
						onClick={() => {
							handleChange(
								"alwaysComputeHintables",
								!dirtySettings.alwaysComputeHintables
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
						isPressed={dirtySettings.showWhatsNewPageOnUpdate}
						onClick={() => {
							handleChange(
								"showWhatsNewPageOnUpdate",
								!dirtySettings.showWhatsNewPageOnUpdate
							);
						}}
					/>
				</SettingRow>
				<SettingRow>
					<RadioGroup
						label="New tab position"
						name="newTabPosition"
						defaultValue={dirtySettings.newTabPosition}
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
						isPressed={dirtySettings.directClickWithNoFocusedDocument}
						onClick={() => {
							handleChange(
								"directClickWithNoFocusedDocument",
								!dirtySettings.directClickWithNoFocusedDocument
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
						isPressed={dirtySettings.directClickWhenEditing}
						onClick={() => {
							handleChange(
								"directClickWhenEditing",
								!dirtySettings.directClickWhenEditing
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
						isPressed={dirtySettings.keyboardClicking}
						onClick={() => {
							handleChange("keyboardClicking", !dirtySettings.keyboardClicking);
						}}
					>
						<p className="explanation">
							Be able to click elements by typing the hint letters.
						</p>
					</Toggle>
				</SettingRow>
				<SettingRow>
					<ExcludeKeysSetting
						value={dirtySettings.keysToExclude}
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
						isPressed={dirtySettings.urlInTitle}
						onClick={() => {
							handleChange("urlInTitle", !dirtySettings.urlInTitle);
						}}
					/>
				</SettingRow>

				<SettingRow>
					<Toggle
						label="Include tab marker in title"
						isPressed={dirtySettings.includeTabMarkers}
						onClick={() => {
							handleChange(
								"includeTabMarkers",
								!dirtySettings.includeTabMarkers
							);
						}}
					/>
				</SettingRow>

				<SettingRow>
					<Toggle
						label="Hide tab markers with global hints toggle off"
						isPressed={dirtySettings.hideTabMarkersWithGlobalHintsOff}
						onClick={() => {
							handleChange(
								"hideTabMarkersWithGlobalHintsOff",
								!dirtySettings.hideTabMarkersWithGlobalHintsOff
							);
						}}
					/>
				</SettingRow>

				<SettingRow>
					<Toggle
						label="Use uppercase tab markers"
						isPressed={dirtySettings.uppercaseTabMarkers}
						isDisabled={!dirtySettings.includeTabMarkers}
						onClick={() => {
							handleChange(
								"uppercaseTabMarkers",
								!dirtySettings.uppercaseTabMarkers
							);
						}}
					/>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Hints appearance">
				<SettingRow>
					<TextInput
						label="Hints to exclude"
						defaultValue={dirtySettings.hintsToExclude}
						onChange={(value) => {
							handleChange("hintsToExclude", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Use numbers for hints"
						isPressed={dirtySettings.useNumberHints}
						isDisabled={dirtySettings.keyboardClicking}
						onClick={() => {
							handleChange("useNumberHints", !dirtySettings.useNumberHints);
						}}
					>
						{dirtySettings.keyboardClicking && (
							<p className="explanation">
								This setting is disabled while keyboard clicking is enabled.
							</p>
						)}
					</Toggle>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Include single letter hints"
						isPressed={dirtySettings.includeSingleLetterHints}
						isDisabled={
							dirtySettings.keyboardClicking || dirtySettings.useNumberHints
						}
						onClick={() => {
							handleChange(
								"includeSingleLetterHints",
								!dirtySettings.includeSingleLetterHints
							);
						}}
					>
						{dirtySettings.keyboardClicking && (
							<p className="explanation">
								This setting is disabled while keyboard clicking is enabled.
								Hints must consist of two letters so all are keyboard reachable.
							</p>
						)}
						{dirtySettings.useNumberHints &&
							!dirtySettings.keyboardClicking && (
								<p className="explanation">
									This setting is disabled when using numbered hints.
								</p>
							)}
					</Toggle>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Use uppercase letters"
						isPressed={dirtySettings.hintUppercaseLetters}
						isDisabled={
							dirtySettings.useNumberHints && !dirtySettings.keyboardClicking
						}
						onClick={() => {
							handleChange(
								"hintUppercaseLetters",
								!dirtySettings.hintUppercaseLetters
							);
						}}
					/>
					{dirtySettings.useNumberHints && !dirtySettings.keyboardClicking && (
						<p className="explanation">
							This setting is disabled when using numbered hints.
						</p>
					)}
				</SettingRow>
				<SettingRow>
					<NumberInput
						label="Viewport margin (px)"
						defaultValue={dirtySettings.viewportMargin}
						min={0}
						max={2000}
						isValid={settings.isValid(
							"viewportMargin",
							dirtySettings.viewportMargin
						)}
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
						defaultValue={dirtySettings.hintFontFamily}
						onChange={(value) => {
							handleChange("hintFontFamily", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>

				<SettingRow>
					<NumberInput
						label="Font size (px)"
						defaultValue={dirtySettings.hintFontSize}
						min={1}
						max={72}
						isValid={settings.isValid(
							"hintFontSize",
							dirtySettings.hintFontSize
						)}
						onChange={(value) => {
							handleChange("hintFontSize", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Bold font"
						isPressed={dirtySettings.hintFontBold}
						onClick={() => {
							handleChange("hintFontBold", !dirtySettings.hintFontBold);
						}}
					/>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Enhanced contrast"
						isPressed={dirtySettings.hintEnhancedContrast}
						onClick={() => {
							handleChange(
								"hintEnhancedContrast",
								!dirtySettings.hintEnhancedContrast
							);
						}}
					/>
				</SettingRow>
				<SettingRow>
					<TextInput
						label="Background color"
						defaultValue={dirtySettings.hintBackgroundColor}
						isValid={settings.isValid(
							"hintBackgroundColor",
							dirtySettings.hintBackgroundColor
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
							.
						</p>
					</TextInput>
				</SettingRow>
				<SettingRow>
					<TextInput
						label="Font/border color"
						defaultValue={dirtySettings.hintFontColor}
						isValid={settings.isValid(
							"hintFontColor",
							dirtySettings.hintFontColor
						)}
						onChange={(value) => {
							handleChange("hintFontColor", value);
						}}
						onBlur={handleBlur}
					>
						{!storedSettings.hintBackgroundColor &&
							dirtySettings.hintFontColor && (
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
							.
						</p>
					</TextInput>
				</SettingRow>

				<SettingRow>
					<NumberInput
						label="Background opacity"
						defaultValue={dirtySettings.hintBackgroundOpacity}
						min={0}
						max={1}
						step={0.05}
						isValid={settings.isValid(
							"hintBackgroundOpacity",
							dirtySettings.hintBackgroundOpacity
						)}
						isDisabled={
							Boolean(storedSettings.hintBackgroundColor) &&
							new Color(storedSettings.hintBackgroundColor).alpha.valueOf() !==
								1
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
							new Color(storedSettings.hintBackgroundColor).alpha.valueOf() !==
								1 && (
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
						defaultValue={dirtySettings.hintBorderWidth}
						min={0}
						max={72}
						isValid={settings.isValid(
							"hintBorderWidth",
							dirtySettings.hintBorderWidth
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
						defaultValue={dirtySettings.hintBorderRadius}
						min={0}
						max={72}
						isValid={settings.isValid(
							"hintBorderRadius",
							dirtySettings.hintBorderRadius
						)}
						onChange={(value) => {
							handleChange("hintBorderRadius", value);
						}}
						onBlur={handleBlur}
					/>
				</SettingRow>
			</SettingsGroup>

			<SettingsGroup label="Custom Hints">
				<p className="explanation">
					Include or exclude CSS selectors for the corresponding pattern.
					Patterns are regular expression that will be used to match against the
					URL of the page.
				</p>
				<SettingRow>
					<CustomHintsSetting
						value={dirtySettings.customSelectors}
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
						defaultValue={dirtySettings.scrollBehavior}
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
						isPressed={dirtySettings.enableNotifications}
						onClick={() => {
							handleChange(
								"enableNotifications",
								!dirtySettings.enableNotifications
							);
						}}
					/>
				</SettingRow>
				<SettingRow>
					<Toggle
						label="Show notification when toggling hints"
						isPressed={dirtySettings.notifyWhenTogglingHints}
						isDisabled={!dirtySettings.enableNotifications}
						onClick={() => {
							handleChange(
								"notifyWhenTogglingHints",
								!dirtySettings.notifyWhenTogglingHints
							);
						}}
					/>
				</SettingRow>
				<SettingRow>
					<Select
						label="Position"
						defaultValue={dirtySettings.toastPosition}
						isDisabled={!dirtySettings.enableNotifications}
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
						defaultValue={dirtySettings.toastDuration}
						isValid={settings.isValid(
							"toastDuration",
							dirtySettings.toastDuration
						)}
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
						defaultValue={dirtySettings.toastTransition}
						isDisabled={!dirtySettings.enableNotifications}
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
