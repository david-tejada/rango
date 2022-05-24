# Changelog

All notable changes to the Rango extension will be documented in this file.

## [0.1.8](https://github.com/david-tejada/rango/releases/tag/v0.1.8) - 2022-05-24

### Added

- Support both manifests v2 and v3 to be also able to publish to the Chrome Web Store

### Fixed

- Fix hints sometimes changing after initial page load

### Changed

- Don't wait for page load to start drawing hints, improving speed. I don't even know why I waited for page load to begin with 🤷
- Only send response back to talon when absolutely necessary to avoid Chromium clipboard sometimes stealing focus

## [0.1.7](https://github.com/david-tejada/rango/releases/tag/v0.1.7) - 2022-05-12

### Added

- Web Components/Shadow DOM support
- Add missing input types that focus on click

### Fixed

- Fix extension starting with the hints off after new install

## [0.1.6](https://github.com/david-tejada/rango/releases/tag/v0.1.6) - 2022-05-11

### Changed

- Now `hints toggle` works in already opened tabs

### Fixed

- Fix regression with `hints toggle` not working globally

## [0.1.5](https://github.com/david-tejada/rango/releases/tag/v0.1.5) - 2022-05-10

If you update to this version remember to update [rango-talon](https://github.com/david-tejada/rango-talon)

### Added

- Rango now supports iframes!
- Added commands for changing hints size: `hint bigger` and `hint smaller`
- More ways to toggle hints on and off:
  - With the shortcut `ctrl-shift-space`
  - Clicking the extension button in the browser toolbar

### Changed

- Reduced displayHints timeout for added snappiness

### Fixed

- Fix hints position not being calculated properly on some pages [#8](https://github.com/david-tejada/rango/issues/8)
- Fix hints not returning to its original size after clicking
