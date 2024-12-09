/* eslint-disable @typescript-eslint/no-empty-function */
class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

globalThis.ResizeObserver = MockResizeObserver;
