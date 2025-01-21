export type ElementHintMark = {
	type: "elementHint";
	value: string;
};

export type ElementReferenceMark = {
	type: "elementReference";
	value: string;
};

export type TextSearchElementMark = {
	type: "textSearch";
	value: string;
	viewportOnly: boolean;
};

export type TabMarkerMark = {
	type: "tabMarker";
	value: string;
};

export type ElementMark =
	| ElementHintMark
	| ElementReferenceMark
	| TextSearchElementMark;

export type TabMark = TabMarkerMark;

export type Mark = ElementMark | TabMark;

type PrimitiveTarget<T extends Mark> = {
	type: "primitive";
	mark: T;
};

type ListTarget<T extends Mark> = {
	type: "list";
	items: Array<PrimitiveTarget<T>>;
};

export type RangeTarget<T extends Mark> = {
	type: "range";
	anchor: PrimitiveTarget<T>;
	active: PrimitiveTarget<T>;
};

export type Target<T extends Mark> =
	| ListTarget<T>
	| PrimitiveTarget<T>
	| RangeTarget<T>;

export function assertPrimitiveTarget<T extends Mark>(
	target: Target<T>
): asserts target is PrimitiveTarget<T> {
	if (target.type !== "primitive") {
		throw new Error("This command only accepts single target.");
	}
}
