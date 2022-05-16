const copyPasteArea = document.createElement("textarea");
copyPasteArea.id = "rango-copy-paste-area";
copyPasteArea.style.position = "fixed";
copyPasteArea.style.left = "0";
copyPasteArea.style.top = "0";
copyPasteArea.style.opacity = "0";
document.body.append(copyPasteArea);

export function getChromiumClipboard(): string {
	let result = "";
	copyPasteArea.focus({ preventScroll: true });
	if (document.execCommand("paste")) {
		result = copyPasteArea.value;
	}

	copyPasteArea.value = "";
	return result;
}

export function copyToChromiumClipboard(text: string) {
	copyPasteArea.value = text;
	copyPasteArea.select();
	document.execCommand("copy");
	copyPasteArea.value = "";
}
