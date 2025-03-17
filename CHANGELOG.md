# Changelog

All notable changes to the Rango extension will be documented in this file.

## [0.8.2](https://github.com/david-tejada/rango/releases/tag/v0.8.1) - 2025-03-17

### Changed

- Associate label with select element on options page
- Changed the behavior of the "now" to reset after clicking an element with
  Rango.
- Increase contrast for code font on settings page.

### Fixed

- Fix error typing keys where hints are off.
- Fix the hints now toggle not working for all frames

### Added

- Add notification to restart the browser on content script error when the
  extension recently updated.

## [0.8.1](https://github.com/david-tejada/rango/releases/tag/v0.8.1) - 2025-02-24

### Fixed

- Fix links with `target="_blank"` being opened twice.
- Fix hints sometimes not working after going back in history.
- Fix clicking on elements that open the system file picker not working.
- Fix positioning of hints for elements that contain hidden text.

## [0.8.0](https://github.com/david-tejada/rango/releases/tag/v0.8.0) - 2025-02-21

### Changed

- Lots of refactoring and repository maintenance.
- Improve error handling and error notifications.
- Avoid executing the command if part of the target is invalid. Display error
  message explaining why the target is invalid.
- Improve tab marker assignment. Now all tabs receive a tab marker even if we
  can't display it in the title. The tab markers are also assigned in the tab
  opening order.
- Make fuzzy search work also on non hintables when a good hintable match isn't
  found.
- Change command `copy text <target>` to `copy content <target>` to avoid
  collisions with fuzzy search targets.
- Improve focus, supporting elements with `tabindex="-1"` and retrying when the
  first focus doesn't actually focus the targeted element.
- Change reference commands to accept multiple words instead of just one.
- Show **What's New** page only on startup to avoid disrupting the user.
- Update rango-talon to use specific actions instead of "stringy" ones. For
  example, `user.rango_click_element(rango_target)` instead of
  `user.rango_command_with_target("clickElement", rango_target)`.
- Change `follow <target>` command to exclusively take into account elements
  within the viewport.
- Improve positioning of hints for elements that contain images.

### Added

- Add command `tab close <target>` for closing tabs by their tab marker.
- Add range target for elements and tab markers. For example,
  `[click] <target> until <target>` or `tab close <target> until <target>`.
- Add targets for fuzzy search `text <user.text>` and references
  `mark <user.text>` that can be used with any command that receives a target.
- Add commands for focusing audible/muted tabs and for muting/unmuting tabs.
  Commands like `mute this`, `mute all`, `go sound` and more.
- Add command `move to <target>` for moving the mouse pointer to an element.
- Add command `mouse click <target>` for clicking an element with the mouse.
- Add command `menu <target>` for right clicking an element with the mouse.
- Add menu item and command `rango what's new` to show the **What's New** page.
- Add ability to snap scroll arbitrary text using `crown <text>`,
  `center <text>` and `bottom <text>`.
- Show notification when direct clicking fails with TimeoutError to warn users
  that might be trying to insert characters without the browser extension
  installed.

### Fixed

- Fix clicking elements that copy text to the clipboard not working. Making no
  longer necessary to use `flick <target>` for those cases.
- Fix hint characters of child frames not refreshing when using the command
  `hints refresh`.
- Fix `pre <target>` and `post <target>` not working for some input element
  types.
- Fix custom hints outline persisting after the element is no longer marked.
- Fix command `toggle show` not working when notifications are disabled.
- Fix keyboard clicking not ignoring hints outside of the viewport.
- Fix limitation of 8192 bytes per item in sync storage.
- Fix slowness displaying hints after multiple tabs have been opened.
- Fix decorations not being removed when saving multiple bookmarks.
- Fix command `flick <target>` not working with some elements like checkboxes
  and radio buttons.
- Fix some issues caused by displaying tab markers on non-HTML tabs.

## [0.7.0](https://github.com/david-tejada/rango/releases/tag/v0.7.0) - 2024-06-17

### Added

- Add setting to always compute hintables.
- Add command for performing action on an element fuzzy searching its text.
- Add ability to customize custom selectors from the settings page.
- Add setting for notifying or not when toggling hints.
- Add command for hiding a specific hint.
- Add command to save a reference to the active element.

### Fixed

- Fix issue with elements not triggering intersection when within
  `positioned: fixed` element.
- Fix hints being read out when using Microsoft Edge Read Aloud function.
- Make hints and keys to exclude settings case insensitive.
- Fix crown not taking account sticky headers with smooth scrolling.
- Fix Discord's internal links opening in a new tab.
- Fix "go input" not working when the hints are off.
- Fix slowness on startup caused by having to reload discarded tabs for
  refreshing tab marker.

### Changed

- Allow smaller hint font size.

## [0.6.3](https://github.com/david-tejada/rango/releases/tag/v0.6.3) - 2024-2-2

### Added

- Log to the console the selectors used when showing references.

### Fixed

- Fix some reference not working when the unique selector uses `href`.
- Fix some instances of hints within tables breaking layout.
- Fix weird behavior displaying hints in contenteditable in
  <https://pad.cogneon.io/>.

## [0.6.2](https://github.com/david-tejada/rango/releases/tag/v0.6.2) - 2023-12-8

### Added

- Add setting to hide tab markers when the hints global toggle is off (#253)
- Add command to get the title of the currently focused tab without including
  the decorations

### Fixed

- Fix includeTabMarkers being altered by clicking the browser action button
- Fix buggy behavior when changing the title of a bookmark manually (#254)
- Handle focus change and update shouldBeHinted for all hintables. Fixes some
  instances of hints not displaying on menus that open when certain element is
  focused. (#256)
- Fix hints not being shown with new color spaces in CSS Colors v4 (#257)
- Improve include or exclude custom hints highlighting for better accessibility
  (#258)
- Fix focus not being called for all HTMLElements (#255)

## [0.6.0](https://github.com/david-tejada/rango/releases/tag/v0.6.0) - 2023-11-13

### Changed

- Clicking the action button also toggles the tab markers keeping them in sync
  with global hints toggle.
- Change the way preferences are declared in rango-talon. Now tags are used
  instead of settings.

### Added

- Add commands for saving references to hints/elements for scripting.
- Add command `exclude all` to exclude all hints for the current host.
- Add command to toggle tab markers.
- Add commands to store custom scroll positions and scroll to them.
- Add command `visit {user.website}` to focus a given tab by URL or create a new
  one.
- Add command `tab hunt <user.text>`, to focus a tab matching a text in the
  title or URL using fuzzy search. Add commands `tab ahead` and `tab behind` to
  cycle through the results.
- Add setting to use numbers instead of letters for hints.
- Add setting to change the viewport margin that determines where hints are
  drawn.
- Add setting to exclude certain strings from being used for hints.
- Add setting for excluding keys for certain URL patterns when using keyboard
  clicking.
- Add browser action context menu `Add Keys to Exclude`. This adds the host
  pattern of the current URL to the `keys to exclude` setting and opens the
  settings page.
- Add `cursor: text` to the elements to show when using hint extra.

### Fixed

- Fix toggle buttons in settings being invisible in high contrast mode.
- Fix invalid tab markers when restoring previous tabs on startup in Firefox.
- Fix some issues where hints for button elements failed to hide when those did.
- Fix an issue where reattaching hints would cause the tab to crash.
- Check if there is an offscreen document before creating one. This tries to fix
  a rare and difficult to reproduce issue where reading from the clipboard would
  fail.
- Remove the decorations added by Rango when saving bookmarks (except in Safari
  as it doesn't support the bookmarks API).
- Avoid the hints being included when printing.
- Fix some discord links opening in a new tab when they shouldn't.
- Fix some instances where direct clicking would be triggered when editing text
  and keyboard clicking on.

### Removed

- Remove commands `rango direct` and `rango explicit`. You can still specify
  which mode you prefer with the tag `user.rango_direct_clicking`.

## [0.5.1](https://github.com/david-tejada/rango/releases/tag/v0.5.1) - 2023-08-13

### Added

- Add "Settings" and "Help" context menu items to the browser action button.

## [0.5.0](https://github.com/david-tejada/rango/releases/tag/v0.5.0) - 2023-08-06

### Changed

- Improve the behavior of commands that place the cursor within or manipulate
  input text.
- Only show "What's New" page for major or minor version updates, not patch
  updates.
- Improvements to toast notifications.
- Improve performance when refreshing hints.
- Improve accessibility of hints (changing the hint size limit from 16px to
  72px).
- Improve accessibility of the settings page.

### Added

- Add keyboard shortcut to enable hints.
- Add command `go input` to focus the first input found on the page.
- Implement tab markers and the ability to focus tabs using them.
- Add additional info to the settings page.
- Add setting for deciding where to open new tabs.
- Add settings to decide when to perform direct clicking.
- Add setting for notifications duration.
- Create keyboard clicking context menu in the browser action button.
- Create onboarding page that shows up on install.

### Fixed

- Fix hints appearance being affected by `letter-spacing` of a parent element.
- Fix tooltip not working properly on some pages.
- Fix hints marked for inclusion or exclusion not being cleared after
  `hints refresh`.
- Fix `custom hints reset` not clearing hints marked for inclusion or exclusion.
- Fix `tab back` sometimes failing.
- Fix custom selectors not working in iframes.
- Fix keyboard clicking failing in some situations.
- Fix wrongly positioned hint for some `contenteditable` elements.
- Fix some hints being partially hidden in OneNote.
- Fix hint not displaying properly with inherited `text-indent`.
- Fix performance issue when calculating if a hintable is redundant.
- Fix wrong stacking context of hints in some situations.
- Fix an issue reclaiming hints from other frames that would cause not all hints
  to be shown when using `hint extra`.

## [0.4.2](https://github.com/david-tejada/rango/releases/tag/v0.4.2) - 2023-04-

### Fixed

- Fix bug introduced in v0.4.1 where no command is able to run if there is no
  content script.

## [0.4.1](https://github.com/david-tejada/rango/releases/tag/v0.4.1) - 2023-04-25

### Fixed

- Fix hints toggle status displaying without using any of the hint toggle
  commands.

## [0.4.0](https://github.com/david-tejada/rango/releases/tag/v0.4.0) - 2023-04-25

### Changed

### Added

- Add toast notifications to provide better user feedback.
- Create a settings page to enable users to manage their preferences.
- Add command `rango settings` to open the setting page.
- Add command `rango open {page}` to quickly open some pages related to Rango
  like the readme, issues, new issue or sponsors.
- Add page What's New to show the user the new features and changes when the
  extension updates.

### Removed

- Remove commands for changing the hint weight and style (boxed or subtle) as
  this can be now accomplished using the settings page.

### Fixed

- Fix hints sometimes not reacting to commands after navigating back or forward
  in the page history.
- Fix allocation of hints in Safari when the user has the option "Preload Top
  Hit in the background" enabled.
- Fix some checkboxes and toggle buttons not receiving hints, considering cases
  where the input/button element is hidden and replaced with a stylized sibling.
- Handle cases where hints are deleted by the page.
- Fix scrolling behavior to ensure the correct scroll amount in various pages.
  Issue #94.
- Fix issue with hints modifying the aspect of tables with
  `table-layout: fixed`. Issue #92.
- Fix keyboard clicking not working in iframes.
- Fix tooltip not always displaying correctly.
- Fix some editable elements not receiving focus when clicked or having the
  cursor placed in the wrong position when using the `post` command.

## [0.3.4](https://github.com/david-tejada/rango/releases/tag/v0.3.4) - 2023-02-24

### Fixed

- Fix regression with not being able to type one or two characters when there is
  no content script

## [0.3.3](https://github.com/david-tejada/rango/releases/tag/v0.3.3) - 2023-02-22

### Fixed

- Use offscreen document to read the clipboard in manifest v3 to fix buggy
  behavior when reading the request.
- Fix sometimes the response not being copied to the clipboard as the offscreen
  document closes too fast.
- Fix timeout error when executing a command that affects all tabs, e.g. "hint
  bigger".

## [0.3.2](https://github.com/david-tejada/rango/releases/tag/v0.3.2) - 2023-02-20

### Added

- Add command for focus and include blur of the current active element in
  dismiss.

### Fixed

- Fix some elements becoming taller when the hints are rendered.
- Fix clicking on `<select>` elements not always working
- Fix elements not receiving focus if the page wasn't focused.
- Fix regression where clicking on anchor element with target="\_blank" is
  blocked by the browser.
- Fix wrong detection of duplicates when the parent is the `<label>` for the
  element.

## [0.3.1](https://github.com/david-tejada/rango/releases/tag/v0.3.1) - 2023-01-30

### Changed

- Change scroll command behavior to follow the user's reduced motion settings.
- Modify the command to delete the contents of a field so that the user is able
  to undo it.

### Added

- Make links inside contenteditable open in a new tab.

### Fixed

- Fix some hints displaying even after disabling them with `hints off`

## [0.3.0](https://github.com/david-tejada/rango/releases/tag/v0.3.0) - 2023-01-27

### Changed

- Complete rewrite of the hint rendering logic to implement **static hints** so
  that the hints always stay with their target element, even when scrolling.
- Include a 1000px viewport margin where the hints are rendered. Serving for a
  nicer scrolling experience.
- Implement fade-in transition effect for the hints when first rendered for a
  smoother experience.
- Render hints using shadow DOM which provides better encapsulation and avoids
  some issues like in #20.
- Improve the positioning of the hints so that more elements are accessible.
- Simplify the logic for detecting what is a hintable element. This improves
  performance and reduces duplicates. A tradeoff is that now, if the element is
  not minimally accessible, it won't display a hint (see custom hints for a
  solution to this).
- Improve page scroll commands so that if the page doesn't scroll it uses the
  scroll container at the center.
- Add `pointer-events: none` to the hint style to prevent it from swallowing
  clicks when using a mouse.
- Include source maps also in production.
- Make the default hotkey `ctrl-shift-insert` for all the browsers except for
  Safari.
- The command `copy text <user.rango_target>` will now also copy the content of
  an input field.
- Disconnect all observers when the hints are off to avoid unnecessary load.
- Batch measuring and writing to the DOM to minimize reflow and avoid potential
  performance issues.

### Added

- Implement custom hints: include mechanism to display more hints when the
  target element doesn't display one. New commands:
  - `hint extra`: Display hints for more elements.
  - `hint more`: Display hints for previously excluded elements.
  - `hint less`: Only display the default hints.
  - `include <user.rango_target>`: Mark the selected hints for inclusion.
  - `exclude <user.rango_target>`: Mark the selected hints for exclusion.
  - `some more`: Mark more hints for inclusion/exclusion.
  - `some less`: Mark less hints for inclusion/exclusion.
  - `custom hints save`: Save the currently selected hints marked for
    inclusion/exclusion so that they render by default.
  - `custom hints reset`: Remove any previously included/excluded custom hints.
- Implement new commands `page next` and `page last` to navigate to the next or
  previous page in paginated sites.
- Implement new command `go root` to navigate to the root of the page.
- Implement new scroll commands:
  - `upper/downer <number>`: Scroll up/down a certain amount of pages.
  - `upper/downer all`: Scroll to the top.
  - `scroll left/right`: Scroll to the left/right.
  - `scroll left/right all`: Scroll all the way to the left/right.
  - `tiny left/right`: Scroll to the left/right a small amount.
  - `upper/downer left/right`: Scroll the left/right aside upwards/downwards.
  - `upper/downer left/right all`: Scroll the left/right aside to the
    top/bottom.
  - `scroll left/right <user.rango_target>`: Scroll the container with the
    hinted element to the left/right.
  - `tiny left/right <user.rango_target>`: Scroll the container with the hinted
    element a small amount to the left/right.
  - `left/right again`: Repeat the previous scroll to the left/right.
- New command `paste to <user.rango_target>` to paste the contents of the
  clipboard to an input field.
- New commands `pre <user.rango_target>` and `post <user.rango_target>` to focus
  an input field and please the caret a the start or the end.
- New command `change <user.rango_target>` to focus an input field and remove
  its contents.
- New commands `insert <user.text> to <user.rango_target>` and
  `enter <user.text> to <user.rango_target>` to enter text to a text field. The
  latter also presses enter.

### Fixed

- Improve the events dispatched to fix some elements not reacting to Rango
  clicks.
- Dynamically retrieve the pointer target so that we click the same element that
  we would if we used the mouse. Fixing some issues of the wrong element being
  clicked.
- Fix regression of commands `up again` and `down again` not working.
- Reimplement the actions `browser.go_back` and `browser.go_forward` in the
  context of Rango to improve their reliability and fix their behavior in
  Chromium browsers due to the history entry being marked as skippable when
  there's no user intervention.
- Fix multiple URLs being added to the end of the document title when the URL
  changes but the title doesn't.
- Fix clicking on `<select>` elements so that it directly opens the menu of
  options.

## [0.2.3](https://github.com/david-tejada/rango/releases/tag/v0.2.3) - 2022-09-02

### Fixed

- Fix issue where opening a link with target="\_blank" with same domain is
  blocked in Firefox.

## [0.2.2](https://github.com/david-tejada/rango/releases/tag/v0.2.2) - 2022-08-24

### Changed

- Avoid direct clicking if the user is in the address bar or in the devtools
- Most hint commands now accept multiple targets, including direct clicking.

### Added

- Added command `tab split` to move current tab to new window.
- Added command `tab back` to switch between the two most recent tabs.
- Added detection of more clickable elements using attribute "jsaction" and
  style "cursor: pointer".

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
- Fixed some elements not reacting to clicks by also dispatching "mousedown" and
  "mouseup" events.
- Fixed some elements not reacting to hover by also dispatching "mouseenter"
  event.
- Fixed url in title sometimes removing the title and leaving only the url.
- Fixed url in title not updating with hash changes.
- Fixed command dismiss buggy behavior.
- Fix error calling "new Color" with empty string which resulted in hints not
  showing in some pages (issue #28)
- Fixed jittery hints after v0.2.0

## [0.2.0](https://github.com/david-tejada/rango/releases/tag/v0.2.0) - 2022-06-22

### Changed

- Use a different tab than the current one to use as copy-paste area in Chromium
  to minimize the issue where the clipboard textarea steals focus.
- Return the focus to the previous active element in Chromium clipboard.
- Improve the appearance and placement of the hints.
- Change hotkey to ctrl-shift-3 as some users were having issues with
  ctrl-shift-insert. Leave the latter as a fallback for backwards compatibility.
- Improved performance by caching hint background color and first text node
  element.
- Improved performance by checking if an element is visible only when necessary.
- Improved hints toggle responsiveness by first updating the active tabs and
  then the rest using window.requestIdleCallback.
- Implement adaptable hints. If part of the element being hinted is still
  visible it will try to place the hint at the bottom left corner.

### Added

- Added command to open one or more links in a new tab without focusing it.
- Added multiple commands for closing tabs.
- Added command for cloning the current tab.
- Added commands for scrolling the current page and the scroll container of a
  particular hint.
- Added command to copy the text content of a hinted element.
- Added command to copy the address of a particular hinted link in markdown
  format.
- Added commands to copy the location information of the current page (host,
  origin, address, ...).
- Added command to copy the address of the current page in markdown format.
- Added commands to change between "boxed" and "subtle" hint style.
- Added command to change the weight of the hint font between "bold", "normal"
  and "auto".
- Added command to refresh the hints without needing to reload the page.
- Added commands to show or hide the hints in five levels of priority (now,
  page, host, tab, global).
- Added commands to include or exclude single letters from hints. Useful to
  minimize misclicks when using direct clicking.
- Added URL in the title (useful so that talon knows the current URL) and
  commands to enable or disable this option.
- Added flashing hint when using the command `hover`.
- Added elements with contenteditable to the elements that need to be hinted.
- Added shortcut to disable the hints.

### Removed

- Removed command `hover fixed` and leave `hover` without a timeout.

### Fixed

- Fixed issue #20 regarding the editor TinyMCE. Now, if the whole body is
  contentEditable, hints won't be displayed.
- In direct clicking mode, if there is no hint or the hints are off, now it will
  type the characters.
- Fixed an issue when some hints would remain even after the hinted element
  wasn't visible in the viewport.
- Fixed hints not including combinations of the same letter.

## [0.1.9](https://github.com/david-tejada/rango/releases/tag/v0.1.9) - 2022-05-25

### Changed

- Go back to sending response with every request but change the order in
  Chromium to avoid the issue where the clipboard textarea steals focus

## [0.1.8](https://github.com/david-tejada/rango/releases/tag/v0.1.8) - 2022-05-24

### Added

- Support both manifests v2 and v3 to be also able to publish to the Chrome Web
  Store

### Fixed

- Fix hints sometimes changing after initial page load

### Changed

- Don't wait for page load to start drawing hints, improving speed. I don't even
  know why I waited for page load to begin with 🤷
- Only send response back to talon when absolutely necessary to avoid Chromium
  clipboard sometimes stealing focus

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

If you update to this version remember to update
[rango-talon](https://github.com/david-tejada/rango-talon)
