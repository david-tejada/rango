<p align="center">
  <img width="300" height="300" src="images/icon.svg">
</p>

# Rango

Rango is a cross browser extension that helps you interact with web pages using your voice and [talon](https://talonvoice.com/). It does this by drawing hints with letters next to elements that you can use to click, hover, copy or show link adresses. It also helps you scroll, open multiple links in new tabs, close multiple tabs and more.

<p align="center">
  <img src="images/screenshot.png">
</p>

## Installation

In order to use the extension you need two pieces: the extension and the talon files.

- The extension can be installed from the respective store: [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rango/), [Chrome](https://chrome.google.com/webstore/detail/rango/lnemjdnjjofijemhdogofbpcedhgcpmb), [Edge](https://microsoftedge.microsoft.com/addons/detail/rango/pcngjebdhphedjkfhipblkgjbjoeaaeb).

- The talon files can be found [here](https://github.com/david-tejada/rango-talon). Clone or download them to your talon user folder.

### Troubleshooting

If the hints are displayed but the commands don't work, most of the time it has to do with the configuration of the hotkey. In order to communicate with Rango, Talon presses a key combination to prompt Rango to read the command present on the clipboard. By default the key combination is `ctrl-shift-insert` in all the browsers except for Safari, where it is `ctrl-shift-3`. If Rango commands aren't working for you, make sure that the hotkey is properly set up. The shortcut that needs to be changed is `Get the talon request`.

#### Where to Find the Extension Keyboard Shortcuts

In Firefox, navigate to [about:addons](about:addons), click on the cog at the top right and then "Manage Extension Shortcuts".

In Chrome, navigate to [chrome://extensions/shortcuts](chrome://extensions/shortcuts).

In Edge, navigate to [edge://extensions/shortcuts](edge://extensions/shortcuts).

## Usage

### Hints

Hints are marks with letters that appear next to elements and that we can use to refer to the element to click, hover, copy its text content, etc.

<p align="left">
  <img src="images/screenshot-hint.png" height=60px">
</p>

#### Which Elements Receive Hints

By default, only certain elements receive hints. If the element is clickable it should receive a hint. Most of the time it does, but in some rare cases, it might not. In order for an element to receive a hint it must be minimally accessible. This means that it must use the right semantic element or indicate what its role is. For example, the following buttons would display a hint.

`<button>Click me!</button>`

`<div role="button">Click me!</div>`

But there won't be a hint for the following element:

`<div class="btn">Click me!</div>`

In earlier versions of the extension I would try to display more hints by default by looking at things like the element's class name, the onclick property or the css property `cursor: pointer`. The issue with this approach is we would get many duplicate hints and some unnecessary ones. Reducing those duplicates and unnecessary hints wasn't always possible and resulted in complicated and poorly performant code.

#### Displaying Extra Hints

Moving away from that complicated logic resulted in better performance and cleaner ui. But now we need a way to display hints for those elements that are not accessible. For that we use the command `hint extra`. At this point we don't care so much about duplicates and we can use all those extra checks to see if an element might be clickable. The command `hint less` lets us go back to only displaying the default hints.

#### Custom Hints

With the command `hint extra` now we have a way to show hints for those elements that don't receive them by default. But you might frequently use some page where some elements that you want to click don't receive hints. Having to use the command `hint extra` every time you want to click one of those elements can become tedious. Custom hints are a way to indicate that you want some extra hints to always display by default.

After having used the command `hint extra` you can use the command `include <user.rango_target>` to indicate that you want some hints to always display. The hints selected for inclusion will be marked in green. The best approach is to use at least a couple of hints representing the same ui element. With those hints Rango calculates the css selector that includes both. It tries not to be greedy and use the selector that includes the least amount of hints possible. This is usually enough to include the desired ui element. In case it falls short and doesn't include all the elements you want, you can use the command `some more`. This will pick a different selector that matches more elements (not necessarily the same elements matched before). The command `some less` does the opposite. You can use the `include` command again if you need to add more hints representing different ui elements. Once you are happy with the result you can use the command `custom hints save` so that those hints appear by default the next time.

Here is one example to illustrate this process:

In [this page](https://forvo.com/word/define/#en) we have this section which unfortunately doesn't show any hints.

<p align="left">
  <img src="images/screenshot-custom-hints-1.png" height=70px">
</p>

Now we use the command `hint extra` to greedily display hints.

<p align="left">
  <img src="images/screenshot-custom-hints-2.png" height=70px">
</p>

If we wanted to show hints for the gray links we can issue the command `include cap each and cap drum`, which marks in green the hints that will be included.

<p align="left">
  <img src="images/screenshot-custom-hints-3.png" height=70px">
</p>

Since the result is not exactly what we want and there are still hints missing we use the command `some more`.

<p align="left">
  <img src="images/screenshot-custom-hints-4.png" height=70px">
</p>

Now there are more hints showing but they're not the ones we want. We issue the command `some more` again to see if that helps.

<p align="left">
  <img src="images/screenshot-custom-hints-5.png" height=70px">
</p>

The hints marked for inclusion now are exactly the ones we want. We could continue including more custom hints using the `include` command again but for the moment we leave it like that and save with `custom hints save`.

<p align="left">
  <img src="images/screenshot-custom-hints-6.png" height=330px">
</p>

Now the extra hints disappear and we are left with the custom hints that we just defined. We can see that similar elements also display hints. Next time we visit the page those hints will be displayed by default.

This same process can be used to exclude hints using the command `exclude <user.rango_target>`. With the command `hint more` we can display any previously excluded hints.

If after using the `include` or `exclude` command you are not happy with the hints marked for inclusion/exclusion you can use the command `some less` (you might have to use it a few times if you've already used the command `some more`) to remove the recently marked hints and start over. This will keep any hints marked with a previous `include` or `exclude` command.

Here is a summary of all the commands for customizing hints:

- `hint extra`: Display hints for more elements.
- `hint more`: Display hints for previously excluded elements.
- `hint less`: Only display the default hints.
- `include <user.rango_target>`: Mark the selected hints for inclusion.
- `exclude <user.rango_target>`: Mark the selected hints for exclusion.
- `some more`: Mark more hints for inclusion/exclusion.
- `some less`: Mark less hints for inclusion/exclusion.
- `custom hints save`: Save the currently selected hints marked for inclusion/exclusion so that they render by default.
- `custom hints reset`: Remove any previously included/excluded custom hints.

### Click

There are two modes: direct and explicit clicking. To switch between them you have to use the command `rango direct` or `rango explicit`. You can also set the default mode by changing the talon setting `user.rango_start_with_direct_clicking` in rango.talon of your rango-talon.

#### Direct Clicking

This is the default mode. With it enabled you just have to say the characters displayed on the hint to click an element. To avoid misclicks it only listens to a pause, one or two letters, followed by another pause. If there is no hint with those letters it will type them. If you actually want to enter one or two characters the are part of a hint you have to use the knausj command `press`.

##### Examples

- `a`: Clicks on the element with the hint `a`
- `gh`: Clicks on the element with the hint `gh`
- `abc`: Enters the characters `abc`
- `press a`: Enters the character `a`

#### Explicit Clicking

With explicit clicking you have to precede every hint with the word `click`. This mode prevents any misclicks at the expense of being a bit more tedious.

#### Keyboard Clicking

Apart from using your voice for clicking you can also use your keyboard for that.

To toggle it you have to use the command `keyboard toggle` or press `ctrl-shift-5` in Firefox. In Chrome and Edge you have to set the shortcut manually since there is a limit of four shortcuts we can set by default. You'll see the toolbar icon shows a little orange dot when keyboard clicking is on. To allow typing text in pages, keyboard clicking will be off whenever the element in focus accepts text input.

### Open in a New Tab

- `blank <hint>`: Opens the link in a new tab.
- `stash <hint>+`: Opens one or more links in a new tab without focusing that tab.

### Hover

- `hover <hint>`: Dispatches a hover event to the selected element. Sometimes this command doesn't have a visible result if the current page doesn't have a hover event handler for this element. One example of a page that does have hover event handlers for links is the Wikipedia, where you'll get a popup with a preview of the linked article.
- `dismiss`: Clears any previously hovered element.

### Show Element Information

- `show <hint>`: Shows a tooltip with the element title and url if the element is a link.

### Scroll

- `upper`: Scroll the page up.
- `downer`: Scroll the page down.

Sometimes we want to scroll a container that is not the main page. An example for that could be a sidebar with links for navigation. For that we need to refer to one of the hints inside said container and use one of the following commands:

- `upper <hint>`: Scroll up the container with the hinted element.
- `downer <hint>`: Scroll down the container with the hinted element.

#### Scrolling Small Amounts

The commands above scroll two thirds of the scrolling container, the following commands scroll one fifth of the scrolling container:

- `tiny up`: Scroll the page up 20%.
- `tiny down`: Scroll the page down 20%.
- `tiny up <hint>`: Scroll up the container with the hinted element 20%.
- `tiny down <hint>`: Scroll down the container with the hinted element 20%.

#### Scrolling an Element to the Top, Bottom or Center

- `crown <hint>`: Scrolls the element with the hint to the top of the page/container. It tries to take into account any sticky/fixed headers and not scroll past that.
- `center <hint>`: Scrolls the element to the center of the page/container.
- `bottom <hint>`: Scrolls the element to the bottom of the page/container.

#### Scrolling the Same Container Repeated Times

Once you have scrolled a container by referring to a hint inside it, you can keep scrolling the same container with these commands without needing to refer to a hint within it again. It will also use the same amount of scroll last used:

- `up again`: Scroll up a previously scrolled container.
- `down again`: Scroll down a previously scrolled container.

#### Custom Scroll Amounts

You can change the scroll amount of these commands or create new scroll commands by adding/changing the last argument in the function call in your rango.talon file. For example, the next commands would scroll up or down half of its scroll container:

```talon
half up: user.rango_command_without_target("scrollUpPage", 0.5)
half down: user.rango_command_without_target("scrollDownPage", 0.5)
half up <user.rango_target>:
  user.rango_command_with_target("scrollUpAtElement", rango_target, 0.5)
half down <user.rango_target>:
  user.rango_command_with_target("scrollDownAtElement", rango_target, 0.5)
```

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
