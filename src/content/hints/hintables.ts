import { Hintable } from "../Hintable";

interface Hintables {
	all: Map<Element, Hintable>;
	get(element: Element): Hintable | undefined;
	set(element: Element, hintable: Hintable): void;
	delete(element: Element): void;
	has(element: Element): boolean;
	getAll(filters?: { intersecting?: boolean; clickable?: boolean }): Hintable[];
	getByHint(hints: string): Hintable | undefined;
	getByHint(hints: string[]): Hintable[];
}

export const hintables: Hintables = {
	all: new Map(),

	get(element: Element): Hintable | undefined {
		return this.all.get(element);
	},

	set(element: Element, hintable: Hintable) {
		this.all.set(element, hintable);
	},

	delete(element: Element) {
		const hintable = this.get(element);
		hintable?.hint?.remove();
		this.all.delete(element);
	},

	has(element: Element): boolean {
		return this.all.has(element);
	},

	getAll(filters?: {
		intersecting?: boolean;
		clickable?: boolean;
	}): Hintable[] {
		const allHintables = Array.from(this.all).map((record) => record[1]);

		return allHintables
			.filter(
				(hintable) =>
					Boolean(filters) ||
					filters?.intersecting === undefined ||
					hintable.isIntersecting === filters.intersecting
			)
			.filter(
				(hintable) =>
					Boolean(filters) ||
					filters?.clickable === undefined ||
					hintable.isClickable === filters.clickable
			);
	},

	getByHint(hints: string | string[]): any {
		const hintables = this.getAll({ intersecting: true, clickable: true });
		if (typeof hints === "string") {
			return hintables.find(
				(hintable) => hintable.hint?.element.textContent === hints
			);
		}

		return hintables.filter(
			(hintable) =>
				hintable.hint?.element.textContent &&
				hints.includes(hintable.hint.element.textContent)
		);
	},
};

setInterval(() => {
	const all = hintables.getAll();
	const sorted = all
		.map((hintable) => ({
			hint: hintable.hint?.element.textContent,
			element: hintable.element,
			hintElement: hintable.hint?.element,
		}))
		.sort((a, b) => {
			if (!a.hint) {
				return -1;
			}

			if (!b.hint) {
				return +1;
			}

			return a.hint.length - b.hint.length || a.hint.localeCompare(b.hint);
		});
	console.debug(sorted);
}, 10000);
