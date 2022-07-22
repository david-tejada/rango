export interface HintsProvision {
	hints: string[];
	initialAmount: number;
}

export interface HintsCache {
	hints: string[];
	initialAmount?: number;
	pop(): string | undefined;
	push(hint: string | string[]): number;
	requestProvision(): void;
}
