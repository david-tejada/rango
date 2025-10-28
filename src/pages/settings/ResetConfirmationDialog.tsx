import { useEffect } from "react";
import { settings } from "../../common/settings/settings";
import "./ResetConfirmationDialog.css";

type ResetConfirmationDialogProps = {
	readonly isOpen: boolean;
	readonly onClose: () => void;
};

export function ResetConfirmationDialog({
	isOpen,
	onClose,
}: ResetConfirmationDialogProps) {
	const handleResetToDefault = async () => {
		try {
			await settings.resetAll();
			onClose();
		} catch (error) {
			console.error("Failed to reset settings:", error);
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
			className="ResetConfirmationDialog"
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
				<h3>Reset Settings to Default</h3>
				<p>
					Are you sure you want to reset all settings to their default values?
					This action cannot be undone.
				</p>
				<div className="buttons">
					<button
						type="button"
						className="confirm"
						onClick={handleResetToDefault}
					>
						Reset to Default
					</button>
					<button type="button" className="cancel" onClick={onClose}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
