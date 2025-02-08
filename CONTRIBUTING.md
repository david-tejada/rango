# Contributing

Welcome! This guide will help you install and run the extension for development.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) `^20`
- [npm](https://www.npmjs.com/get-npm)

### Install

Clone and cd into the repository:

```bash
git clone https://github.com/david-tejada/rango.git
cd rango
```

Install dependencies:

```bash
npm install
```

### Run the extension for development

It is recommended to use Firefox for development as content scripts reload
automatically:

First, build the extension in watch mode.

```bash
npm run watch:firefox
```

Then, in another terminal, launch a Firefox instance using
[mozilla/web-ext](https://github.com/mozilla/web-ext).

```bash
npm run start:firefox
```

You can also run the extension in Chrome. Note that in Chrome content scripts
don't reload when the extension changes, so you need to refresh the page every
time there is a change in the extension's code:

First, build the extension in watch mode:

```bash
npm run watch:chrome
```

Then, in another terminal, run the extension:

```bash
npm run start:chrome
```

To launch alternative Chromium browsers like Edge or Brave you can use the flag
`--chromium-binary` and append the path to the binary suitable for your
operating system:

```bash
# Launch Brave on MacOS
npm run start:chrome -- --chromium-binary /Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser
```

### Safari

Safari
[only supports web extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
bundled inside a native Mac app. If you are _not_ building for development,
Safari
[only loads web extensions if their containing apps are distributed via the Mac App Store](https://developer.apple.com/documentation/safariservices/safari_web_extensions/distributing_your_safari_web_extension),
or
[if you select “Allow unsigned extensionsʺ from the Debug menu on each launch](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension)
(requires authentication).

To build for development:

1. Build the extension for Safari in watch mode:

   ```bash
   npm run watch:safari
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

6. At this point the files produced by the build process might not match the
   ones specified in `Rango/Rango for Safari.xcodeproj/project.pbxproj`. If
   that's the case some of them will be marked in red. In that case, in Xcode,
   select all the files inside `Shared (Extension)/Resources` and delete them
   (select `Remove References` when prompted). Then, right click on `Resources`
   and select `Add Files to "Rango for Safari"`. Select all the files within
   `dist/safari`. Make sure that only `Rango for Safari Extension (macOS)` is
   checked in the `Targets` section.

7. Build the project (`cmd-b`).

8. Enable the extension in Safari’s Preferences.

9. After making changes to the extension, you need to run the build process
   again and refresh the page in Safari.
