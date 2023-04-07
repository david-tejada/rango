export const urls = {
	icon48: new URL("../assets/icon48.png", import.meta.url),
	icon128: new URL("../assets/icon128.png", import.meta.url),
	iconKeyboard48: new URL(
		"../assets/icon-keyboard-clicking48.png",
		import.meta.url
	),
	offscreenDocument: new URL(
		"../background/utils/offscreen.html",
		import.meta.url
	),
} as const;
