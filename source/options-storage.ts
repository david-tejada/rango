// I need to disable this rule because I get a strange linting error:
// I will disabled the rule until I figure out what is happening
/* eslint-disable @typescript-eslint/no-unsafe-call */

import OptionsSync from "webext-options-sync";

export default new OptionsSync({
	defaults: {
		colorRed: 244,
		colorGreen: 67,
		colorBlue: 54,
		text: "Set a text!",
	},
	migrations: [OptionsSync.migrations.removeUnused],
	logging: true,
});
