const path = require("node:path");
const EXTENSION_PATH = path.resolve(__dirname, "dist-mv3");

module.exports = {
	launch: {
		dumpio: false,
		devtools: true,
		headless: false,
		product: "chrome",
		args: [
			`--disable-extensions-except=${EXTENSION_PATH}`,
			`--load-extension=${EXTENSION_PATH}`,
		],
	},
	browserContext: "default",
};
