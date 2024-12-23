import { createElement } from "../dom/utils";
import { type ElementWrapper } from "../wrappers/ElementWrapper";

export function drawPattern(wrapper: ElementWrapper) {
	const { top, left } = wrapper.element.getClientRects()[0]!;
	console.log(wrapper);
	console.log("drawPattern");
	const canvas: HTMLCanvasElement =
		document.querySelector("#rangoCanvas") ??
		createElement("canvas", {
			id: "rangoCanvas",
			width: 2,
			height: 16,
		});
	canvas.style.position = "fixed";
	canvas.style.top = `0px`;
	canvas.style.left = `0px`;
	canvas.style.zIndex = "1000000";
	canvas.style.pointerEvents = "none";
	canvas.style.maxWidth = "100%";
	canvas.style.maxHeight = "100%";
	canvas.style.imageRendering = "pixelated";
	const ctx = canvas.getContext("2d")!;

	// Helper function to draw one 2x8 pattern section
	const drawPatternSection = (startY: number) => {
		// First row pair
		ctx.fillStyle = "#FF0000"; // Pure Red
		ctx.fillRect(0, startY + 0, 1, 1);
		ctx.fillStyle = "#00FF00"; // Pure Green
		ctx.fillRect(1, startY + 0, 1, 1);

		// Second row pair
		ctx.fillStyle = "#0000FF"; // Pure Blue
		ctx.fillRect(0, startY + 1, 1, 1);
		ctx.fillStyle = "#FFFF00"; // Yellow
		ctx.fillRect(1, startY + 1, 1, 1);

		// Third row pair
		ctx.fillStyle = "#FF0000"; // Pure Red
		ctx.fillRect(0, startY + 2, 1, 1);
		ctx.fillStyle = "#00FF00"; // Pure Green
		ctx.fillRect(1, startY + 2, 1, 1);

		// Fourth row pair
		ctx.fillStyle = "#0000FF"; // Pure Blue
		ctx.fillRect(0, startY + 3, 1, 1);
		ctx.fillStyle = "#FFFF00"; // Yellow
		ctx.fillRect(1, startY + 3, 1, 1);

		// Fifth row pair
		ctx.fillStyle = "#FF0000"; // Pure Red
		ctx.fillRect(0, startY + 4, 1, 1);
		ctx.fillStyle = "#00FF00"; // Pure Green
		ctx.fillRect(1, startY + 4, 1, 1);

		// Sixth row pair
		ctx.fillStyle = "#0000FF"; // Pure Blue
		ctx.fillRect(0, startY + 5, 1, 1);
		ctx.fillStyle = "#FFFF00"; // Yellow
		ctx.fillRect(1, startY + 5, 1, 1);

		// Seventh row pair
		ctx.fillStyle = "#FF0000"; // Pure Red
		ctx.fillRect(0, startY + 6, 1, 1);
		ctx.fillStyle = "#00FF00"; // Pure Green
		ctx.fillRect(1, startY + 6, 1, 1);

		// Eighth row pair
		ctx.fillStyle = "#0000FF"; // Pure Blue
		ctx.fillRect(0, startY + 7, 1, 1);
		ctx.fillStyle = "#FFFF00"; // Yellow
		ctx.fillRect(1, startY + 7, 1, 1);
	};

	// Draw the pattern twice
	drawPatternSection(0); // First section
	drawPatternSection(8); // Second section

	document.body.append(canvas);
	console.log("canvas", canvas);
	setTimeout(() => {
		canvas.remove();
	}, 1000);

	return { left, top };
}
