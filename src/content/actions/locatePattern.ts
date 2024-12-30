import { setStyleProperties } from "../dom/setStyleProperties";
import { createElement } from "../dom/utils";
import { type ElementWrapper } from "../wrappers/ElementWrapper";

const squareSize = 3;

export function drawLocatePattern(
	wrapper: ElementWrapper,
	colors: [number, number, number, number]
) {
	const rect = wrapper.element.getClientRects()[0]!;
	const { top, left, width, height } =
		rect.width > 0 && rect.height > 0
			? rect
			: wrapper.element.getBoundingClientRect();

	const canvas: HTMLCanvasElement =
		document.querySelector("#rangoCanvas") ??
		createElement("canvas", {
			id: "rangoCanvas",
			width: squareSize * 2,
			height: squareSize * 2,
		});

	setStyleProperties(canvas, {
		position: "fixed",
		width: `${(squareSize * 2) / window.devicePixelRatio}px`,
		height: `${(squareSize * 2) / window.devicePixelRatio}px`,
		top: `${top + height / 2}px`,
		left: `${left + width / 2}px`,
		"z-index": "2147483647",
		"pointer-events": "none",
		"image-rendering": "pixelated",
	});

	const ctx = canvas.getContext("2d")!;

	draw4x4Pattern(ctx, colors);

	document.body.append(canvas);

	setTimeout(() => {
		canvas.remove();
	}, 1000);
}

export function removeLocatePattern() {
	document.querySelector("#rangoCanvas")?.remove();
}

function draw4x4Pattern(
	ctx: CanvasRenderingContext2D,
	colors: [number, number, number, number]
) {
	const hexColors = colors.map(
		(n: number) => "#" + n.toString(16).padStart(6, "0")
	) as [string, string, string, string];

	ctx.fillStyle = hexColors[0];
	ctx.fillRect(0, 0, squareSize, squareSize);
	ctx.fillStyle = hexColors[1];
	ctx.fillRect(squareSize, 0, squareSize, squareSize);
	ctx.fillStyle = hexColors[2];
	ctx.fillRect(0, squareSize, squareSize, squareSize);
	ctx.fillStyle = hexColors[3];
	ctx.fillRect(squareSize, squareSize, squareSize, squareSize);
}
