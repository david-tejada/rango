// Using this because I can't find a way to make import.meta.url work in Jest
/* eslint-disable unicorn/prefer-module */
import path from "node:path";

export function getFileUrlPath(relativePath: string) {
	const directory = path.resolve(__dirname, "..", relativePath);
	return new URL(directory, "file://").toString();
}
