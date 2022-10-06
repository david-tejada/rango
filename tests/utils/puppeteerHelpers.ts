import puppeteer from "puppeteer";

export async function getAttribute(
	selector: string,
	attribute: string,
	page: puppeteer.Page
) {
	const attributeValue = await page.evaluate(
		(selector, attribute) => {
			const element = document.querySelector(selector);
			return element?.getAttribute(attribute);
		},
		selector,
		attribute
	);

	if (!attributeValue) {
		throw new Error("No element or attribute found.");
	}

	return attributeValue;
}

export async function getElementProperty(
	selector: string,
	property: string,
	page: puppeteer.Page
) {
	const $element = await page.$(selector);
	const $property = await $element?.getProperty(property);
	return $property?.jsonValue();
}
