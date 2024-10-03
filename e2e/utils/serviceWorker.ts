import { TargetType } from "puppeteer";

async function getServiceWorker() {
	const workerTarget = await browser.waitForTarget(
		(target) => target.type() === TargetType.SERVICE_WORKER
	);

	return (await workerTarget.worker())!;
}

/**
 * This is used to make headless testing possible. Because in Chrome for Testing
 * `document.execCommand` doesn't work we need a way to test without using the
 * real clipboard. It reads and writes from and to local storage.
 */
export const storageClipboard = {
	async readText() {
		const worker = await getServiceWorker();
		const { clipboard } = (await worker.evaluate(async () =>
			chrome.storage.local.get("clipboard")
		)) as { clipboard: string };

		return clipboard;
	},
	async writeText(text: string) {
		const worker = await getServiceWorker();

		await worker.evaluate(async (text) => {
			await chrome.storage.local.set({ clipboard: text });
		}, text);
	},
};

export async function runTestRequest(request: string) {
	const worker = await getServiceWorker();

	await worker.evaluate(async (request) => {
		await chrome.storage.local.set({ clipboard: request });
		dispatchEvent(new CustomEvent("handle-test-request"));
	}, request);
}
