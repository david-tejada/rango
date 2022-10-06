class mockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

window.ResizeObserver = mockResizeObserver;
