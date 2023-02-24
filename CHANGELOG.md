# Changelog

All notable changes to the Rango extension will be documented in this file.

## [0.3.4](https://github.com/david-tejada/rango/releases/tag/v0.3.4) - 2023-02-24

### Fixed

- Fix regression with not being able to type one or two characters when there is no content script

## [0.3.3](https://github.com/david-tejada/rango/releases/tag/v0.3.3) - 2023-02-22

### Fixed

- Use offscreen document to read the clipboard in manifest v3 to fix buggy behavior when reading the request.
- Fix sometimes the response not being copied to the clipboard as the offscreen document closes too fast.
- Fix timeout error when executing a command that affects all tabs, e.g. "hint bigger".

## [0.3.2](https://github.com/david-tejada/rango/releases/tag/v0.3.2) - 2023-02-20

### Added

- Add command for focus and include blur of the current active element in dismiss.

### Fixed

- Fix some elements becoming taller when the hints are rendered.
- Fix clicking on `<select>` elements not always working
- Fix elements not receiving focus if the page wasn't focused.
- Fix regression where clicking on anchor element with target="\_blank" is blocked by the browser.
- Fix wrong detection of duplicates when the parent is the `<label>` for the element.

## [0.3.1](https://github.com/david-tejada/rango/releases/tag/v0.3.1) - 2023-01-30

### Changed

- Change scroll command behavior to follow the user's reduced motion settings.
- Modify the command to delete the contents of a field so that the user is able to undo it.

### Added

- Make links inside contenteditable open in a new tab.

### Fixed

- Fix some hints displaying even after disabling them with `hints off`

## [0.3.0](https://github.com/david-tejada/rango/releases/tag/v0.3.0) - 2023-01-27

### Changed

- Complete rewrite of the hint rendering logic to implement **static hints** so that the hints always stay with their target element, even when scrolling.
- Include a 1000px viewport margin where the hints are rendered. Serving for a nicer scrolling experience.
- Implement fade-in transition effect for the hints when first rendered for a smoother experience.
- Render hints using shadow DOM which provides better encapsulation and avoids some issues like in #20.
- Improve the positioning of the hints so that more elements are accessible.
- Simplify the logic for detecting what is a hintable element. This improves performance and reduces duplicates. A tradeoff is that now, if the element is not minimally accessible, it won't display a hint (see custom hints for a solution to this).
- Improve page scroll commands so that if the page doesn't scroll it uses the scroll container at the center.
- Add `pointer-events: none` to the hint style to prevent it from swallowing clicks when using a mouse.
- Include source maps also in production.
- Make the default hotkey `ctrl-shift-insert` for all the browsers except for Safari.
- The command `copy text <user.rango_target>` will now also copy the content of an input field.
- Disconnect all observers when the hints are off to avoid unnecessary load.
- Batch measuring and writing to the DOM to minimize reflow and avoid potential performance issues.

### Added

- Implement custom hints: include mechanism to display more hints when the target element doesn't display one. New commands:
  - `hint extra`: Display hints for more elements.
  - `hint more`: Display hints for previously excluded elements.
  - `hint less`: Only display the default hints.
  - `include <user.rango_target>`: Mark the selected hints for inclusion.
  - `exclude <user.rango_target>`: Mark the selected hints for exclusion.
  - `some more`: Mark more hints for inclusion/exclusion.
  - `some less`: Mark less hints for inclusion/exclusion.
  - `custom hints save`: Save the currently selected hints marked for inclusion/exclusion so that they render by default.
  - `custom hints reset`: Remove any previously included/excluded custom hints.
- Implement new commands `page next` and `page last` to navigate to the next or previous page in paginated sites.
- Implement new command `go root` to navigate to the root of the page.
- Implement new scroll commands:
  - `upper/downer <number>`: Scroll up/down a certain amount of pages.
  - `upper/downer all`: Scroll to the top.
  - `scroll left/right`: Scroll to the left/right.
  - `scroll left/right all`: Scroll all the way to the left/right.
  - `tiny left/right`: Scroll to the left/right a small amount.
  - `upper/downer left/right`: Scroll the left/right aside upwards/downwards.
  - `upper/downer left/right all`: Scroll the left/right aside to the top/bottom.
  - `scroll left/right <user.rango_target>`: Scroll the container with the hinted element to the left/right.
  - `tiny left/right <user.rango_target>`: Scroll the container with the hinted element a small amount to the left/right.
  - `left/right again`: Repeat the previous scroll to the left/right.
- New command `paste to <user.rango_target>` to paste the contents of the clipboard to an input field.
- New commands `pre <user.rango_target>` and `post <user.rango_target>` to focus an input field and please the caret a the start or the end.
- New command `change <user.rango_target>` to focus an input field and remove its contents.
- New commands `insert <user.text> to <user.rango_target>` and `enter <user.text> to <user.rango_target>` to enter text to a text field. The latter also presses enter.

### Fixed

- Improve the events dispatched to fix some elements not reacting to Rango clicks.
- Dynamically retrieve the pointer target so that we click the same element that we would if we used the mouse. Fixing some issues of the wrong element being clicked.
- Fix regression of commands `up again` and `down again` not working.
- Reimplement the actions `browser.go_back` and `browser.go_forward` in the context of Rango to improve their reliability and fix their behavior in Chromium browsers due to the history entry being marked as skippable when there's no user intervention.
- Fix multiple URLs being added to the end of the document title when the URL changes but the title doesn't.
- Fix clicking on `<select>` elements so that it directly opens the menu of options.

## [0.2.3](https://github.com/david-tejada/rango/releases/tag/v0.2.3) - 2022-09-02

### Fixed

- Fix issue where opening a link with target="\_blank" with same domain is blocked in Firefox.

## [0.2.2](https://github.com/david-tejada/rango/releases/tag/v0.2.2) - 2022-08-24

### Changed

- Avoid direct clicking if the user is in the address bar or in the devtools
- Most hint commands now accept multiple targets, including direct clicking.

### Added

- Added command `tab split` to move current tab to new window.
- Added command `tab back` to switch between the two most recent tabs.
- Added detection of more clickable elements using attribute "jsaction" and style "cursor: pointer".

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
