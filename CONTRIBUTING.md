# Contributing

## Installation

```bash
npm install
```

## Running the extension

Depending on the target browser, you need to build the extension for Manifest version 2 or 3.

This can be done with:

- `npm run-script watch` - where the extension will be built into the directory `dist-mv2`
- `npm run-script watch:mv3` - where the extension will be built into the directory `dist-mv3`

You can then follow the guide for how to load the extension into your browser of choice.

The project includes scripts for running the extension in Firefox and Chromium using the  [WebExtension tool](https://github.com/mozilla/web-ext) for your convenience.

### Firefox

```bash
npm run-script watch
npm run-script start:firefox
```

### Chrome & Chromium Browsers

By default `start:chromium` will launch Google Chrome:

```bash
npm run-script watch:mv3
npm run-script start:chromium
```

To launch alternative Chromium browsers like Edge or Brave you can append the path to the binary suitable for your operating system:

_This example is for launching Brave on MacOS_

```bash
npm run-script start:chromium -- --chromium-binary /Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser
```
