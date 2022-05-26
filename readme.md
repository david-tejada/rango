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

You can install the extension from the respective store: [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rango/), [Chrome](https://chrome.google.com/webstore/detail/rango/lnemjdnjjofijemhdogofbpcedhgcpmb)

You can download the talon files from [here](https://github.com/david-tejada/rango-talon). Clone or download them to your talon user folder.

## Usage

There are two modes: direct and explicit clicking. To switch between them you have to use the command `rango direct` or `rango explicit`.

### Direct Clicking

This is the default mode. With it enabled you just have to say the characters to click an element. To avoid misclicks it only listens to a pause, one or two letters followed by another pause. If you actually want to enter one or two letters you have to use the knausj command `press`

#### Examples

- `a`: Clicks on link with the hint `a`
- `gh`: Clicks on link with the hint `gh`
- `abc`: Enters the characters `abc`
- `press a`: Enters the character `a`

### Explicit Clicking

With explicit clicking you have to precede every hint with the word `click`. This mode prevents any misclicks at the expense of being a bit more tedious.

### Other Commands

- `hover <hint>`: It hovers over the element. After 10 seconds the element will be automatically unhovered.
- `hover fix <hint>`: It hovers over the element. The element will not be automatically unhovered.
- `dismiss`: It clears any previously hovered element.
- `show <hint>`: It shows the url address.
- `copy link <hint>`: It copies the url address to the clipboard.
- `blank <hint>`: It opens the link in a new tab.
- `hints toggle`: It shows and hides the hints.
- `hint bigger`: It increases the size of the hints
- `hint smaller`: It decreases the size of the hints

### Changing Hints Font Type

At the moment there is no option to customize the hints font type. Options for that will be added in the future. In the meantime if you find hints text difficult to read, apart from using the commands for changing the hints size, you can change the monospace font in the browser settings and the hints will render with that font.
