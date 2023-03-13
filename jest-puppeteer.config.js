const path = require("node:path");
const EXTENSION_PATH = path.resolve(__dirname, "dist-mv3");

module.exports = {
	launch: {
		dumpio: false,
		devtools: false,
		headless: false,
		product: "chrome",
		executablePath: process.env.PUPPETEER_EXEC_PATH,
		args: [
			"no-sandbox",
			`--disable-extensions-except=${EXTENSION_PATH}`,
			`--load-extension=${EXTENSION_PATH}`,
		],
	},
	browserContext: "default",
	server: {
		command: "node ./e2e/serve.js",
		port: 8080,
	},
};
