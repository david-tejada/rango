export const urls = {
	icon48: new URL("../assets/icon48.png", import.meta.url),
	icon128: new URL("../assets/icon128.png", import.meta.url),
	iconSvg: new URL("../assets/icon.svg", import.meta.url),
	iconKeyboard48: new URL(
		"../assets/icon-keyboard-clicking48.png",
		import.meta.url
	),
	offscreenDocument: new URL(
		"../background/clipboard/offscreen.html",
		import.meta.url
	),
	whatsNewPage: new URL("../pages/whatsNew/index.html", import.meta.url),
	onboarding: new URL("../pages/onboarding/index.html", import.meta.url),
	clipboardWriteInterceptor: new URL(
		"../content/actions/clipboardWriteInterceptor.js",
		import.meta.url
	),
} as const;
