// I need to disable some linting rules because I get strange linting errors.
// Just until I figure out what's happening
/* eslint-disable 
@typescript-eslint/no-unsafe-assignment,
@typescript-eslint/no-unsafe-call,
@typescript-eslint/restrict-template-expressions
*/

import optionsStorage from "./options-storage";

async function init() {
	const options = await optionsStorage.getAll();
	const color = `rgb(${options.colorRed}, ${options.colorGreen}, ${options.colorBlue})`;
	const text = options.text;
	const notice = document.createElement("div");
	notice.innerHTML = text;
	document.body.append(notice);
	notice.id = "text-notice";
	notice.style.border = "2px solid " + color;
	notice.style.color = color;
}

init().catch((error) => {
	console.log(error);
});
