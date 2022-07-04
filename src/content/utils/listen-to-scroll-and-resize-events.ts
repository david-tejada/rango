import { triggerHintsUpdate } from "../hints/display-hints";
import { intersectors } from "../intersectors";
import { scrollContainers } from "./container-is-scrolling";

const msToWaitAfterScroll = 750;
const msToWaitAfterWindowResize = 300;

export async function listenToScrollAndResizeEvents() {
	let hintsUpdateTimeout: ReturnType<typeof setTimeout>;

	window.addEventListener(
		"scroll",
		(event) => {
			if (event.target && !scrollContainers.has(event.target)) {
				scrollContainers.set(event.target, false);
				let scrollTimeout: ReturnType<typeof setTimeout>;

				event.target?.addEventListener("scroll", (event) => {
					clearTimeout(scrollTimeout);

					if (event.target) {
						scrollContainers.set(event.target, true);
					}

					// We hide the hints immediately in case the scrolling container is not the whole page
					for (const intersector of intersectors) {
						if (
							intersector.hintElement &&
							// This next line is always false when scrolling the whole page
							intersector?.scrollContainer === event.target
						) {
							intersector.hintElement.style.display = "none";
						}
					}

					scrollTimeout = setTimeout(async () => {
						if (event.target) {
							scrollContainers.set(event.target, false);
							await triggerHintsUpdate();
						}
					}, msToWaitAfterScroll);
				});
			}
		},
		true
	);

	window.addEventListener("resize", async () => {
		clearTimeout(hintsUpdateTimeout);
		hintsUpdateTimeout = setTimeout(
			triggerHintsUpdate,
			msToWaitAfterWindowResize
		);
	});
}
