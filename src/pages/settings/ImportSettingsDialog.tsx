import { useEffect, useState } from "react";
import { settings } from "../../common/settings/settings";
import { type Settings } from "../../common/settings/settingsSchema";
import "./ImportSettingsDialog.css";

type ImportSettingsDialogProps = {
	readonly isOpen: boolean;
	readonly onClose: () => void;
};

export function ImportSettingsDialog({
	isOpen,
	onClose,
}: ImportSettingsDialogProps) {
	const [importText, setImportText] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
				setImportText("");
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	const handleImport = async () => {
		try {
			setErrorMessage("");
			const parsedSettings = JSON.parse(importText) as Partial<Settings>;
			for (const [key, value] of Object.entries(parsedSettings)) {
				const validity = settings.checkValidity(key as keyof Settings, value);

				if (!validity.valid) {
					throw new Error(
						`Invalid setting ${key}: ${settings.checkValidity(key as keyof Settings, value).message}`
					);
				}
			}

			await Promise.all(
				Object.entries(parsedSettings).map(async ([key, value]) => {
					return settings.set(key as keyof Settings, value);
				})
			);

			onClose();
			setImportText("");
		} catch (error) {
			console.error("Failed to import settings:", error);
			setErrorMessage(
				"Invalid settings format. Please check your JSON and try again."
			);
		}
	};

	const handleCancel = () => {
		onClose();
		setImportText("");
		setErrorMessage("");
	};

	if (!isOpen) return null;

	return (
		<div
			className="ImportSettingsDialog"
			onClick={() => {
				handleCancel();
			}}
		>
			<div
				className="content"
				onClick={(e) => {
					e.stopPropagation();
				}}
			>
				<h3>Import Settings</h3>
				<p>Paste your settings JSON below:</p>
				<textarea
					autoFocus
					placeholder="Paste your settings JSON here..."
					value={importText}
					onChange={(e) => {
						setImportText(e.target.value);
						if (errorMessage) {
							setErrorMessage("");
						}
					}}
				/>
				{errorMessage && <div className="error-message">{errorMessage}</div>}
				<div className="buttons">
					<button
						type="button"
						className="import"
						disabled={!importText.trim()}
						onClick={handleImport}
					>
						Import
					</button>
					<button type="button" className="cancel" onClick={handleCancel}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
