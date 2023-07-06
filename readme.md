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

- The talon files can be found in the [rango-talon](https://github.com/david-tejada/rango-talon) repository. Clone or download them to your talon user folder. **IMPORTANT**: Make sure to clone or download the **rango-talon** repository and not this one.

### Troubleshooting

If the hints are displayed but the commands don't work, most of the time it has to do with the configuration of the hotkey. In order to communicate with Rango, Talon presses a key combination to prompt Rango to read the command present on the clipboard. By default the key combination is `ctrl-shift-insert` in all the browsers except for Safari, where it is `ctrl-shift-3`. If Rango commands aren't working for you, make sure that the hotkey is properly set up. The shortcut that needs to be changed is `Get the talon request`.

#### Where to Find the Extension Keyboard Shortcuts

In Firefox, navigate to [about:addons](about:addons), click on the cog at the top right and then "Manage Extension Shortcuts".

In Chrome, navigate to [chrome://extensions/shortcuts](chrome://extensions/shortcuts).

In Edge, navigate to [edge://extensions/shortcuts](edge://extensions/shortcuts).

## Settings

There are several settings you can adjust to change the appearance of the hints and the overall behavior of the extension. To open the settings page you just need to use the command `rango settings`.

## Usage

**Note**: The notation `<target>` in this readme can refer to a single or multiple hints chained with the word `and`. For example, the command `click any and bat` would click on the elements marked with the hints `a` and `b`. Most Rango commands accept multiple hints as target.

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

After having used the command `hint extra` you can use the command `include <target>` to indicate that you want some hints to always display. The hints selected for inclusion will be marked in green. The best approach is to use at least a couple of hints representing the same ui element. With those hints Rango calculates the css selector that includes both. It tries not to be greedy and use the selector that includes the least amount of hints possible. This is usually enough to include the desired ui element. In case it falls short and doesn't include all the elements you want, you can use the command `some more`. This will pick a different selector that matches more elements (not necessarily the same elements matched before). The command `some less` does the opposite. You can use the `include` command again if you need to add more hints representing different ui elements. Once you are happy with the result you can use the command `custom hints save` so that those hints appear by default the next time.

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

This same process can be used to exclude hints using the command `exclude <target>`. With the command `hint more` we can display any previously excluded hints.

If after using the `include` or `exclude` command you are not happy with the hints marked for inclusion/exclusion you can use the command `some less` (you might have to use it a few times if you've already used the command `some more`) to remove the recently marked hints and start over. This will keep any hints marked with a previous `include` or `exclude` command.

Here is a summary of all the commands for customizing hints:

- `hint extra`: Display hints for more elements.
- `hint more`: Display hints for previously excluded elements.
- `hint less`: Only display the default hints.
- `include <target>`: Mark the selected hints for inclusion.
- `exclude <target>`: Mark the selected hints for exclusion.
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

#### Focus

- `focus <target>`: Focus the target element.

#### Focus and Enter

Clicking with Rango might fail on some elements. For example, clicking on elements that copy things to the clipboard almost always fails because the browser thinks there was no user interaction and disallows it. To avoid this pitfall you might use the following command.

- `flick <target>`: Focus an element and then press enter with talon.

### Open in a New Tab

- `blank <target>`: Opens the link in a new tab. If you use multiple targets all the links will open in new tabs and the first one will receive focus.
- `stash <target>`: Opens the link in a new tab without focusing that tab. When using direct clicking and multiple targets you can omit the word `stash`. For example, `air bat and air drum` will open the links with the hints "ah" and "ad" in a new tab without stealing focus from the current one.

### Navigation

- `go root`: Navigate to the root of the current page.
- `page next`: Navigate to the next page in paginated pages.
- `page last`: Navigate to the previous page in paginated pages.

### Input Fields

**Note**: "Input field" here refers to any element with editable content. It doesn't need to be an `<input>` element.

- `paste to <target>`: Paste the contents of the clipboard to an input field.
- `insert <text> to <target>`: Inserts text to an input field. It first clicks the element so it will work in places were you first have to click a button that opens the field, like a search button.
- `enter <text> to <target>`: Same as the previous command but it also presses the enter key at the end to submit.
- `change <target>`: Focus an input field and remove its contents.
- `pre <target>`: Places the cursor at the start of an input field.
- `post <target>`: Places the cursor at the end of an input field.

### Copy to the Clipboard

- `copy <target>`: If the element is a link it copies the url to the clipboard.
- `copy mark <target>`: If the element is a link it copies the link in markdown format to the clipboard.
- `copy text <target>`: Copies the text content of the element to the clipboard.

### Copy Current URL Information

- `copy page (address | host name | host | origin | path | port | protocol)`: Copies the information relative to the current URL to the clipboard.
- `copy mark address`: Copies the current URL in markdown format to the clipboard.

### Hover

- `hover <target>`: Dispatches a hover event to the selected element. Sometimes this command doesn't have a visible result if the current page doesn't have a hover event handler for this element. One example of a page that does have hover event handlers for links is the Wikipedia, where you'll get a popup with a preview of the linked article.
- `dismiss`: Clears any previously hovered element. If there is a focused element it would also remove the focus from that element.

### Show Element Information

- `show <target>`: Shows a tooltip with the element title and url if the element is a link.

### Scroll

The default behavior for scrolling in Rango is "smooth". The behavior will be "instant" if you have configured your OS to prefer reduced motion. You can follow the instructions [here](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion#user_preferences) if you want to know how to do that.

#### Page Scrolling

These commands scroll the page, that is, the html or body elements, or the scroll container at the center of the page if those elements don't scroll.

- `upper/downer`: Scroll up/down.
- `upper/downer <number>`: Scroll up/down a certain amount of pages.
- `upper/downer all`: Scroll all the way to the top/bottom.
- `tiny up/down`: Scroll the page up/down a factor of 0.2.
- `scroll left/right`: Scroll to the left/right.
- `scroll left/right all`: Scroll all the way to the left/right.
- `tiny left/right`: Scroll to the left/right a factor of 0.2.

#### Aside Scrolling

You can easily scroll the left or right aside with these commands:

- `upper/downer left/right`: Scroll the left/right aside upwards/downwards.
- `upper/downer left/right all`: Scroll the left/right aside to the top/bottom.

#### Scrolling the Container That Includes a Hinted Element

Sometimes we want to scroll a container that is not the main page or an aside. An example for that could be a popup with links. For that we need to refer to one of the hints inside said container and use one of the following commands:

- `upper/downer <target>`: Scroll up/down the container with the hinted element.
- `tiny up/down <target>`: Scroll up/down the container with the hinted element a factor of 0.2.
- `scroll left/right <target>`: Scroll the container with the hinted element to the left/right.
- `tiny left/right <target>`: Scroll the container with the hinted element to the left/right a factor of 0.2.

#### Scrolling the Same Container Repeated Times

Once you have scrolled a container by referring to a hint inside it, you can keep scrolling the same container with these commands without needing to refer to a hint within it again. It will also use the same amount of scroll last used:

- `up/down/left/right again`: Scroll up/down/left/right the same factor a previously scrolled container.

#### Scrolling an Element to the Top, Bottom or Center

- `crown <target>`: Scrolls the element with the hint to the top of the page/container. It tries to take into account any sticky/fixed headers and not scroll past that.
- `center <target>`: Scrolls the element to the center of the page/container.
- `bottom <target>`: Scrolls the element to the bottom of the page/container.

#### Custom Scroll Amounts

You can change the scroll amount of these commands or create new scroll commands by adding/changing the last argument in the action call in your rango.talon file. For example, the next commands would scroll up or down half of its scroll container:

```talon
half up: user.rango_command_without_target("scrollUpPage", 0.5)
half down: user.rango_command_without_target("scrollDownPage", 0.5)
half up <user.rango_target>:
  user.rango_command_with_target("scrollUpAtElement", rango_target, 0.5)
half down <user.rango_target>:
  user.rango_command_with_target("scrollDownAtElement", rango_target, 0.5)
```

### Tabs

- `tab clone`: Duplicates the current tab.
- `tab back`: Switches to the previously focused tab.
- `tab split`: Move the current tab to a new window.

#### Close Tabs

- `tab close other`: Closes all the tabs in the window except the current one.
- `tab close left`: Closes all the tabs in the window to the left of the current one.
- `tab close right`: Closes all the tabs in the window to the right of the current one.
- `tab close first [<number>]`: Closes the amount of tabs specified (or one if no number is given) starting from the leftmost tab.
- `tab close final [<number>]`: Closes the amount of tabs specified (or one if no number is given) starting from the rightmost tab.
- `tab close previous [<number>]`: Closes the amount of tabs specified (or one if no number is given) to the left of the current tab.
- `tab close next [<number>]`: Closes the amount of tabs specified (or one if no number is given) to the right of the current tab.

### Modify Hints Size

- `hint bigger`: Increase the size of the hints.
- `hint smaller`: Decrease the size of the hints.

### Show and Hide the Hints

- `hints refresh`: Refreshes the hints without needing to reload the page.
- `hints toggle`: Toggles the hints on and off.
- `hints on/off [now | page | host | tab]`: Turns on/off the hints with an optional priority level.
  - `now`: This is the highest level of priority. The hints will be toggled on/off for the current page until the page is reloaded or the user navigates to another page.
  - `page`: The hints will always be on/off for the current page.
  - `host`: The hints will always be on/off for the current host.
  - `tab`: The hints will always be on/off for the current tab.
  - `global`: The hints will be on/off globally.
  - If we just say `hints on` the hints are toggled globally in all tabs and in all windows. This is the lowest level of priority, if any of the previous toggles are set they will take precedence over this one.
- `hints reset (page | host | tab | global | everywhere)`: clears the toggles for the selected level.

#### Other ways to toggle the hints on and off:

- Using the keyboard shortcut `ctrl-shift-space`.
- Clicking on the Rango icon in the toolbar.

### Opening Rango Related Pages

- The command `rango open {page}` opens a Rango related page in a new tab. The pages are: sponsor, readme, issues, new issue and changelog.

## Known Issues and Limitations

- There is currently no way to open a pure CSS dropdown menu like the "hover" menu in [this example](https://www.tailwindtoolbox.com/components/megamenu-demo.php#). It is not possible to activate the `:hover` pseudo class in javascript and this will only be possible once I implement cursor moving/clicking.

## Contributing

See the [Contributing guide](CONTRIBUTING.md).
