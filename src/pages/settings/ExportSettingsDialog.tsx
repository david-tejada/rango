import { useEffect, useState } from "react";
import { type Settings } from "../../common/settings/settingsSchema";
import "./ExportSettingsDialog.css";

type ExportSettingsDialogProps = {
	readonly isOpen: boolean;
	readonly onClose: () => void;
	readonly settings: Settings;
};

export function ExportSettingsDialog({
	isOpen,
	onClose,
	settings,
}: ExportSettingsDialogProps) {
	const [copied, setCopied] = useState(false);

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="ExportSettingsDialog"
			onClick={() => {
				onClose();
			}}
		>
			<div
				className="content"
				onClick={(e) => {
					e.stopPropagation();
				}}
			>
				<h3>Export Settings</h3>
				<textarea readOnly value={JSON.stringify(settings, null, 2)} />
				<div className="buttons">
					<button
						type="button"
						className={`copy ${copied ? "copied" : ""}`}
						onClick={handleCopyToClipboard}
					>
						{copied ? "Copied!" : "Copy to Clipboard"}
					</button>
					<button
						type="button"
						className="close"
						onClick={() => {
							onClose();
						}}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
