# K++
A userscript that adds some tweaks to [Kongregate]'s chat

## Features
1. Toggles chat width (enlarge/restore):  
 - automatically - at script execution (e.g. by clicking the bookmark if the script is run as a bookmarklet).  
 - manually - with the corresponding cog wheel menu entry
2. Adds a search bar (above chat) to search chat messages:
 - matching messages get a pink background to facilitate recognition
 - new messages that match the search criteria automatically get the pink background
 - filter the user list by clicking the user button next to the search bar.
 - Shortcuts when the cursor is inside the search bar:
   - Escape key - clears the search key and restores the list
   - TAB key - toggles between user filtering and search bar mode  
 - 'Room' chat has its own search bar  
3. URLs in chat messages are automatically converted into interactive hyperlinks:
 - click to open in a new tab
4. Optionally hides chat messages' timestamps or makes them visible when the mouse cursor hovers over chat messages:
 - change mode via the corresponding cog wheel menu entry
 - the mode is memorized in localStorage
5. Optionally saves 'Game' chat to localStorage every 8 messages and autosaves chat (if changed) after a configurable amount of chat inactivity time
6. Additional cog wheel menu entries:
 - "Timestamps"
   - Set: Fixed (default)
   - Set: Dynamic
   - Set: Off
 - "Toggle chat width"

## Installation
###### Recommended way:
1. Install a userscript manager
 - [Greasemonkey] - Firefox
 - [Tampermonkey] - Chrome
2. Install the script from github
 - [K++.user.js](https://github.com/Adored0ne/K-plus-plus/raw/master/src/K%2B%2B.user.js)

###### Other ways (choose one):
:warning: if you are not installing the script in the Recommended way, remove the UserScript comments (first 10 lines) so that the first line becomes:  
`javascript: (function() {`

- Run the script from a bookmark. To do so, create a new bookmark in your browser with the js code as the "URL"
- Copy and Paste the whole script in the browser's Console and press "Enter"
- (Chrome) Run the script from the Snippets within the Sources panel of Chrome DevTools. To do so, follow the instructions available at: https://developers.google.com/web/tools/chrome-devtools/snippets
- (Chrome) Run the script from a folder. To do so, follow the instructions available at: http://stackoverflow.com/a/10612311

## See also

See [Contributing](docs/contributing.md) for additional information on building and contributing to K++.


[Kongregate]:https://www.kongregate.com
[Greasemonkey]:https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/
[Tampermonkey]:https://tampermonkey.net/
