# Changelog

All notable changes to the Rango extension will be documented in this file.

## [0.2.1](https://github.com/david-tejada/rango/releases/tag/v0.2.1) - 2022-07-04

### Changed

- Changed hints size and positioning so they get less in the way.
- Hide hints when scrolling unless they scroll with the page.
- Don't show hints on disabled elements.

### Added

- Added commands for scrolling element to top, center and bottom.
- Added additional parameter to the API for custom scroll amount.
- Added role="menuitemradio" to clickable elements.
- Added keyboard clicking.
- Added element title to "show" command.
- Added ability to click on multiple targets.

### Fixed

- Fixed occurrences of duplicated hints.
- Fixed some elements not reacting to clicks by also dispatching "mousedown" and "mouseup" events.
- Fixed some elements not reacting to hover by also dispatching "mouseenter" event.
- Fixed url in title sometimes removing the title and leaving only the url.
- Fixed url in title not updating with hash changes.
- Fixed command dismiss buggy behavior.
- Fix error calling "new Color" with empty string which resulted in hints not showing in some pages (issue #28)
- Fixed jittery hints after v0.2.0

## [0.2.0](https://github.com/david-tejada/rango/releases/tag/v0.2.0) - 2022-06-22

### Changed

- Use a different tab than the current one to use as copy-paste area in Chromium to minimize the issue where the clipboard textarea steals focus.
- Return the focus to the previous active element in Chromium clipboard.
- Improve the appearance and placement of the hints.
- Change hotkey to ctrl-shift-3 as some users were having issues with ctrl-shift-insert. Leave the latter as a fallback for backwards compatibility.
- Improved performance by caching hint background color and first text node element.
- Improved performance by checking if an element is visible only when necessary.
- Improved hints toggle responsiveness by first updating the active tabs and then the rest using window.requestIdleCallback.
- Implement adaptable hints. If part of the element being hinted is still visible it will try to place the hint at the bottom left corner.

### Added

- Added command to open one or more links in a new tab without focusing it.
- Added multiple commands for closing tabs.
- Added command for cloning the current tab.
- Added commands for scrolling the current page and the scroll container of a particular hint.
- Added command to copy the text content of a hinted element.
- Added command to copy the address of a particular hinted link in markdown format.
- Added commands to copy the location information of the current page (host, origin, address, ...).
- Added command to copy the address of the current page in markdown format.
- Added commands to change between "boxed" and "subtle" hint style.
- Added command to change the weight of the hint font between "bold", "normal" and "auto".
- Added command to refresh the hints without needing to reload the page.
- Added commands to show or hide the hints in five levels of priority (now, page, host, tab, global).
- Added commands to include or exclude single letters from hints. Useful to minimize misclicks when using direct clicking.
- Added URL in the title (useful so that talon knows the current URL) and commands to enable or disable this option.
- Added flashing hint when using the command `hover`.
- Added elements with contenteditable to the elements that need to be hinted.
- Added shortcut to disable the hints.

### Removed

- Removed command `hover fixed` and leave `hover` without a timeout.

### Fixed

- Fixed issue #20 regarding the editor TinyMCE. Now, if the whole body is contentEditable, hints won't be displayed.
- In direct clicking mode, if there is no hint or the hints are off, now it will type the characters.
- Fixed an issue when some hints would remain even after the hinted element wasn't visible in the viewport.
- Fixed hints not including combinations of the same letter.

## [0.1.9](https://github.com/david-tejada/rango/releases/tag/v0.1.9) - 2022-05-25

### Changed

- Go back to sending response with every request but change the order in Chromium to avoid the issue where the clipboard textarea steals focus

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
