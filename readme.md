<p align="center">
  <img width="300" height="300" src="images/icon.svg">
</p>

# Rango

Rango is a cross browser extension that helps you interact with web pages using your voice and [talon](https://talonvoice.com/). It does this by drawing hints with letters next to elements that you can use to click, hover, copy or show link adresses and many more features to come.

<p align="center">
  <img src="images/screenshot.png">
</p>

## Installation

In order to use the extension you need two pieces: the extension and the talon files.

- The extension can be installed from the respective store: [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rango/), [Chrome](https://chrome.google.com/webstore/detail/rango/lnemjdnjjofijemhdogofbpcedhgcpmb)

- The talon files can be found [here](https://github.com/david-tejada/rango-talon). Clone or download them to your talon user folder.

### Troubleshooting

If the hints are displayed but the commands don't work, most of the time it has to do with the configuration of the hotkey. In order to communicate with Rango, Talon presses a key combination to prompt Rango to read the command present on the clipboard. By default the key combination is `ctrl-shift-insert` in Windows and Linux and `ctrl-shift-3` in Mac. If Rango commands aren't working for you, make sure that the hotkey is properly set up.

In Firefox, navigate to [about:addons](about:addons), click on the cog at the top right and then "Manage Extension Shortcuts".

In Chrome, navigate to [chrome://extensions/](chrome://extensions/), click on the hamburger menu at the top left and select "Keyboard shortcuts".

## Usage

### Click

There are two modes: direct and explicit clicking. To switch between them you have to use the command `rango direct` or `rango explicit`. You can also set the default mode by changing the talon setting `user.rango_start_with_direct_clicking` in browser.talon of your rango-talon.

#### Direct Clicking

This is the default mode. With it enabled you just have to say the characters displayed on the hint to click an element. To avoid misclicks it only listens to a pause, one or two letters, followed by another pause. If there is no hint with those letters it will type them. If you actually want to enter one or two characters the are part of a hint you have to use the knausj command `press`.

##### Examples

- `a`: Clicks on the element with the hint `a`
- `gh`: Clicks on the element with the hint `gh`
- `abc`: Enters the characters `abc`
- `press a`: Enters the character `a`

#### Explicit Clicking

With explicit clicking you have to precede every hint with the word `click`. This mode prevents any misclicks at the expense of being a bit more tedious.

### Open in a New Tab

- `blank <hint>`: Opens the link in a new tab.
- `stash <hint>+`: Opens one or more links in a new tab without focusing that tab.

### Hover

- `hover <hint>`: Dispatches a hover event to the selected element. Sometimes this command doesn't have a visible result if the current page doesn't have a hover event handler for this element. One example of a page that does have hover event handlers for links is the Wikipedia, where you'll get a popup with a preview of the linked article.
- `dismiss`: Clears any previously hovered element.

### Show Link URL

- `show <hint>`: Shows the url if the element is a link.

### Scroll

- `upper`: Scroll the page up.
- `downer`: Scroll the page down.
- `upper <hint>`: Scroll up the container with the hinted element.
- `downer <hint>`: Scroll down the container with the hinted element.
- `up again`: Scroll up a previously scrolled container.
- `down again`: Scroll down a previously scrolled container.

### Copy Target Information

- `copy <hint>`: If the element is a link it copies the url to the clipboard.
- `copy mark <hint>`: If the element is a link it copies the link in markdown format to the clipboard.
- `copy text <hint>`: Copies the text content of the element to the clipboard.

### Copy Current URL Information

- `copy page (address | host name | host | origin | path | port | protocol)`: Copies the information relative to the current URL to the clipboard.
- `copy mark address`: Copies the current URL in markdown format to the clipboard.

### Clone Tab

- `tab clone`: Duplicates the current tab.

### Close Tabs

- `tab close other`: Closes all the tabs in the window except the current one.
- `tab close left`: Closes all the tabs in the window to the left of the current one.
- `tab close right`: Closes all the tabs in the window to the right of the current one.
- `tab close first [<number_small>]`: Closes the amount of tabs specified (or one if no number is given) starting from the leftmost tab.
- `tab close final [<number_small>]`: Closes the amount of tabs specified (or one if no number is given) starting from the rightmost tab.
- `tab close previous [<number_small>]`: Closes the amount of tabs specified (or one if no number is given) to the left of the current tab.
- `tab close next [<number_small>]`: Closes the amount of tabs specified (or one if no number is given) to the right of the current tab.

### Modify Hints Appearance

- `hint bigger`: Increase the size of the hints.
- `hint smaller`: Decrease the size of the hints.
- `hint (boxed | subtle)`: Change the style of the hints. `boxed` is the default where all hints appear with a border and a solid background. `subtle` removes the border and, in inline elements, the hint background is transparent.
- `hint weight (auto | bold | normal)`: `auto` takes into account the hint contrast and size to calculate the font weight. With the other two modes the hints are all bold or normal.

#### Exclude or Include Single Letter Hints

- `hint exclude singles`: Exclude single letter hints. Useful to minimize misclicks when using direct clicking.
- `hint include singles`: Include single letter hints.

### Show and Hide the Hints

- `hints refresh`: Refreshes the hints without needing to reload the page.
- `hints toggle`: Toggles the hints on and off.
- `hints on/off [now | page | host | tab]`: Turns on/off the hints with an optional priority level.
  - `now`: This is the highest level of priority. The hints will be toggled on/off for the current page until the page is reloaded or the user navigates to another page.
  - `page`: The hints will always be on/off for the current page.
  - `host`: The hints will always be on/off for the current host.
  - `tab`: The hints will always be on/off for the current tab.
  - If we just say `hints on` the hints are toggled globally in all tabs and in all windows. This is the lowest level of priority, if any of the previous toggles are set they will take precedence over this one.
- `hints reset (page | host | tab | everywhere)`: clears the toggles for these selected level.

#### Other ways to toggle the hints on and off:

- Using the keyboard shortcut `ctrl-shift-space`.
- Clicking on the Rango icon in the toolbar.

### Changing Hints Font Family

If you find hints text difficult to read, apart from using the commands for changing the hints size and font weight, you can change the monospace font in the browser settings and the hints will render with that font.

## Contributing

See the [Contributing guide](CONTRIBUTING.md).
