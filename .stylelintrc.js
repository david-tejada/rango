module.exports = {
	extends: ["stylelint-config-standard"],
	rules: {
		"selector-class-pattern": [
			"^([a-z]+(-[a-z0-9]+)*)|([A-Z][a-z0-9]*)+$",
			{
				message: (selector) =>
					`Expected class selector "${selector}" to be kebab-case or PascalCase`,
			},
		],
	},
};
