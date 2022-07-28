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
	updateTree(element: Element): void;
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
					!filters ||
					filters?.intersecting === undefined ||
					hintable.isIntersecting === filters.intersecting
			)
			.filter(
				(hintable) =>
					!filters ||
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

	updateTree(element: Element): void {
		const elements = [element, ...element.querySelectorAll("*")];
		for (const element of elements) {
			const hintable = this.all.get(element);
			if (hintable) {
				hintable.update();
			}
		}
	},
};

setInterval(() => {
	const all = hintables.getAll();
	const sorted = all
		.map((hintable) => ({
			id: hintable.id,
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
	if (sorted.length > 0) {
		console.debug(sorted);
	}

	const sortedById = all
		.map((hintable) => ({
			id: hintable.id,
			hint: hintable.hint?.element.textContent,
			element: hintable.element,
			hintElement: hintable.hint?.element,
			isIntersecting: hintable.isIntersecting,
		}))
		.sort((a, b) => a.id - b.id);
	if (sortedById.length > 0) {
		console.debug(sortedById);
	}
}, 10_000);
