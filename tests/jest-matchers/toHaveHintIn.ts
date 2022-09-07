import puppeteer from "puppeteer";

interface CustomMatchers<R = unknown> {
	toHaveHintIn(containerSelector: string, page: puppeteer.Page): Promise<R>;
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		interface Expect extends CustomMatchers {}
		interface Matchers<R> extends CustomMatchers<R> {}
		interface InverseAsymmetricMatchers extends CustomMatchers {}
	}
}

expect.extend({
	async toHaveHintIn(
		linkSelector: string,
		containerSelector: string,
		page: puppeteer.Page
	) {
		const hintString = await page.$eval(
			linkSelector,
			(element) => (element as HTMLElement).dataset["hint"]
		);
		const hintElement = await page.$(
			`.rango-hint-wrapper[data-hint="${hintString!}"]`
		);
		const container = await page.$(containerSelector);

		const pass = await page.evaluate(
			(hintElement, container) => {
				console.log({ hintElement, container });
				return hintElement?.parentElement === container;
			},
			hintElement,
			container
		);
		if (pass) {
			return {
				message: () =>
					`expected "${linkSelector}" not to have a hint in "${containerSelector}"`,
				pass: true,
			};
		}

		return {
			message: () =>
				`expected "${linkSelector}" to have a hint in "${containerSelector}"`,
			pass: false,
		};
	},
});
