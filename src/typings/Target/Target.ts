export type ElementHintMark = {
	type: "elementHint";
	value: string;
};

export type ElementReferenceMark = {
	type: "elementReference";
	value: string;
};

export type FuzzyTextElementMark = {
	type: "fuzzyText";
	value: string;
	prioritizeViewport: boolean;
};

export type TabHintMark = {
	type: "tabHint";
	value: string;
};

export type ElementMark =
	| ElementHintMark
	| ElementReferenceMark
	| FuzzyTextElementMark;

export type TabMark = TabHintMark;

export type Mark = ElementMark | TabMark;

type PrimitiveTarget<T extends Mark> = {
	type: "primitive";
	mark: T;
};

type ListTarget<T extends Mark> = {
	type: "list";
	items: Array<PrimitiveTarget<T>>;
};

export type Target<T extends Mark> = ListTarget<T> | PrimitiveTarget<T>;

export type ElementTarget = Target<ElementMark>;
export type TabTarget = Target<TabMark>;

export function assertPrimitiveTarget<T extends Mark>(
	target: Target<T>
): asserts target is PrimitiveTarget<T> {
	if (target.type !== "primitive") {
		throw new Error("This command only accepts single target.");
	}
}
