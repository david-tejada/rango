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

### Safari

Safari [only supports web extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions) bundled inside a native Mac app. If you are *not* building for development, Safari [only loads web extensions if their containing apps are distributed via the Mac App Store](https://developer.apple.com/documentation/safariservices/safari_web_extensions/distributing_your_safari_web_extension), or [if you select “Allow unsigned extensionsʺ from the Debug menu on each launch](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension) (requires authentication).

To build for development:

1. Build the extension for manifest version 2:

    ```bash
    npm run build:mv2-safari
    ```

2. Update the project's marketing version from the manifest.

    ```bash
    swift Rango/Build/UpdateRangoVersion.swift
    ```

3. Copy the template xcconfig to a user-specific one.

    ```bash
    cp Rango/Build/UserSpecific{.template,}.xcconfig
    ```

4. Open the Rango project in Xcode.
    ```bash
    xed Rango
    ```

5. Edit `Build` » `UserSpecific.xcconfig` according to the comments in the file.

6. Build and run the project.

7. Enable the extension in Safari’s Preferences.