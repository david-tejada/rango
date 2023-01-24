/* eslint-disable @typescript-eslint/no-empty-function */
class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

window.ResizeObserver = MockResizeObserver;
