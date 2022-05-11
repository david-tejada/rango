# Change Log

All notable changes to the Rango extension will be documented in this file.

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
