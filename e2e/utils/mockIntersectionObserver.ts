/* eslint-disable @typescript-eslint/no-empty-function */
class MockIntersectionObserver {
	readonly root: Element | null;

	readonly rootMargin: string;

	readonly thresholds: readonly number[];

	constructor() {
		this.root = null;
		this.rootMargin = "";
		this.thresholds = [];
	}

	disconnect() {}

	observe() {}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}

	unobserve() {}
}

window.IntersectionObserver = MockIntersectionObserver;
