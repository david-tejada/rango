/**
 * This module implements a proxy for the intersection observer where it also
 * takes into account not just if the element is intersecting its scroll
 * container but also if the element is within the bounds of the viewport
 * plus rootMargin.
 */

import { throttle } from "../../lib/debounceAndThrottle";
import { assertDefined } from "../../typings/TypingUtils";

function isIntersectingViewportMargin(target: Element, margin: number) {
	const { top, bottom, left, right } = target.getBoundingClientRect();
	const viewportHeight = document.documentElement.clientHeight;
	const viewportWidth = document.documentElement.clientWidth;
	return (
		bottom > -margin &&
		top < viewportHeight + margin &&
		right > -margin &&
		left < viewportWidth + margin
	);
}

interface ObservationTargetStatus {
	// Is intersecting the scroll container or the viewport if root is null, including margins
	isIntersectingRoot?: boolean;
	// This can only be true if isIntersectingRoot is true
	isIntersecting?: boolean;
}

export class BoundedIntersectionObserver implements IntersectionObserver {
	readonly callback: IntersectionObserverCallback;
	readonly root: Element | Document | null;
	readonly rootMargin: string;
	readonly rootMarginNumber: number;
	readonly thresholds: number[];

	observationTargets: Map<Element, ObservationTargetStatus>;
	trueObserver: IntersectionObserver;

	constructor(
		callback: IntersectionObserverCallback,
		options: IntersectionObserverInit
	) {
		this.callback = callback;
		this.root = options.root ?? null;

		// For the moment we assume that we will receive just one value for all the margins
		this.rootMargin = options.rootMargin ?? "0px";
		this.rootMarginNumber = Number.parseInt(this.rootMargin, 10);

		const threshold = options.threshold ?? 0;
		this.thresholds = Array.isArray(threshold) ? threshold : [threshold];

		this.observationTargets = new Map();

		this.trueObserver = new IntersectionObserver(
			this.onIntersection.bind(this),
			options
		);

		if (this.root && this.root instanceof Element) {
			const throttledScrollCallback = throttle(() => {
				const filteredEntries: IntersectionObserverEntry[] = [];

				for (const [target, status] of this.observationTargets.entries()) {
					const wasIntersecting = status.isIntersecting;

					// This is the only case that matters as when the element is not
					// intersecting its root it will always be not intersecting and
					// we manage that in onIntersection
					if (status.isIntersectingRoot) {
						status.isIntersecting = isIntersectingViewportMargin(
							target,
							this.rootMarginNumber
						);

						if (status.isIntersecting !== wasIntersecting) {
							filteredEntries.push({
								// For the moment we only need these properties
								target,
								isIntersecting: status.isIntersecting,
							} as IntersectionObserverEntry);
						}
					}
				}

				if (filteredEntries.length > 0) {
					this.callback(filteredEntries, this);
				}
			}, 50);

			this.root.addEventListener("scroll", throttledScrollCallback, {
				passive: true,
			});
			window.addEventListener("scroll", throttledScrollCallback, {
				passive: true,
			});
		}
	}

	disconnect() {
		this.observationTargets.clear();
		this.trueObserver.disconnect();
	}

	observe(target: Element) {
		if (!this.observationTargets.has(target)) {
			this.observationTargets.set(target, {});
		}

		this.trueObserver.observe(target);
	}

	unobserve(target: Element) {
		//
		/**
		 * We need to clean the records here before removing the target from
		 * observationTargets. If not we could get an intersection entry of an
		 * element that is not in observationTargets anymore
		 */
		this.onIntersection(this.trueObserver.takeRecords(), this.trueObserver);
		this.trueObserver.unobserve(target);
		this.observationTargets.delete(target);
	}

	onIntersection(
		entries: IntersectionObserverEntry[],
		observer: IntersectionObserver
	) {
		// If the root observer is observing the viewport we know that whatever
		// we get from these entries is valid
		if (observer.root === null) {
			this.callback(entries, this);
		} else {
			const relevantEntries: IntersectionObserverEntry[] = [];

			for (const entry of entries) {
				const status = this.observationTargets.get(entry.target);
				assertDefined(status);
				status.isIntersectingRoot = entry.isIntersecting;

				const wasIntersecting = status.isIntersecting;

				if (entry.isIntersecting) {
					// Since its intersecting its root the only thing we need to check if
					// it's within the bounds of the viewport plus margins
					status.isIntersecting = isIntersectingViewportMargin(
						entry.target,
						this.rootMarginNumber
					);
				} else {
					status.isIntersecting = false;
				}

				// We only add the entry if the isIntersecting status changed
				if (status.isIntersecting !== wasIntersecting) {
					relevantEntries.push({
						target: entry.target,
						isIntersecting: status.isIntersecting,
					} as IntersectionObserverEntry);
				}
			}

			if (relevantEntries.length > 0) this.callback(relevantEntries, this);
		}
	}

	takeRecords(): IntersectionObserverEntry[] {
		// For the moment I don't need to implement this
		return [];
	}
}
