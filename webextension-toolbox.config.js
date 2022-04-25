/* eslint-disable */
const path = require("path");

module.exports = {
	webpack(config, { dev, vendor }) {
		config.entry = {
			background: path.join("background/background.ts"),
			content: path.join("content/content.ts"),
		};
		config.output = {
			path: path.join(__dirname, "dist", vendor),
			filename: "[name].js",
		};
		return config;
	},
};
