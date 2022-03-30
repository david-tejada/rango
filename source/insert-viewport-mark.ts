const canvas = document.createElement("canvas");
canvas.width = 10;
canvas.height = 10;
canvas.style.position = "absolute";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.zIndex = "99999";

const ctx = canvas.getContext("2d");
ctx!.fillStyle = "red";
ctx!.fillRect(0, 0, 10, 10);

document.body.append(canvas);
