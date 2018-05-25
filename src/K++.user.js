// ==UserScript==
// @name         KonzenChat
// @namespace    http://tampermonkey.net/
// @version      2.0.6
// @description  Kongregate chat Mod
// @author       KonzenDouji
// @match        https://www.kongregate.com/*
// @grant        none
// ==/UserScript==

javascript: (function () {

	/* Features: */
	/* 1. toggles chat width at script execution (e.g. by clicking the bookmark if the script is run as a bookmarklet) or using the "Toggle chat width" option in the cog wheel menu */
	/* 2. adds a searchbar (above chat) to search the whole chat:
	 - matching messages get a pink background to facilitate recognition
	 - new messages that match the search criteria automatically get the pink background
    /* 2a. filter the user list by clicking the user button next to the searchbar. */
	/* 2b. shortcuts when the cursor is inside the searchbar:
	 - ESC key clears the search key and restores the list
	 - TAB key toggles between user filtering and searchbar mode */
	/* 2c. 'Room' chat has its own searchbar */
	/* 3. optionally hides chat messages timestamps or makes them visible when the mouse cursor hovers over chat messages:
	 - change mode via the "Timestamps" option in the cog wheel menu
	 - the mode is memorized in localStorage */
	/* 4. optionally saves 'Game' chat to localStorage every 8 messages and autosaves chat (if changed) after a configurable amount of chat inactivity time */
	/* 5. [2.0.1] URLs are automatically turned into interactive hyperlinks. Click to open in a new tab */

	/* How to use this script: (choose one of the following methods) */
	/* 1. TamperMonkey (browser extension). To do so, just add the script to TamperMonkey */

	/* [ATTENTION] if you are not using the script with TamperMonkey, remove the UserScript comments (first 10 lines) so that the first line becomes: "javascript: (function() {" */
	/* 2. Run the script from a bookmark. To do so:
	 - [NOT REQUIRED ANYMORE] compress it using any online js minifier, for example: https://skalman.github.io/UglifyJS-online/
	 - create a new bookmark in your browser with the js code as the "URL" */
	/* 3. Copy and Paste the whole script in the browser's Console and press "Enter" */
	/* 4. (Chrome) Run the script from the Snippets within the Sources panel of Chrome DevTools. To do so, follow the instructions available at: https://developers.google.com/web/tools/chrome-devtools/snippets */
	/* 5. (Chrome) Run the script from a folder. To do so, follow the instructions available at: http://stackoverflow.com/a/10612311 */

	start();
})();

function start() {
	if (document.initialized == null) {
		if (document.getElementsByClassName('chat_message_window')[1] === undefined) {
			setTimeout(start, 300);
			return;
		}
		/* Configuration variables: */
		/* expandBy (number) - pixels to be added to chat container width */
		/* localStorage (true|false) - true: enables saving chat to localStorage, false: disables saving chat to localStorage */
		/* localStorageSize (number) - max number of chat messages to save in localStorage */
		/* autosave (number) - number of chat inactivity seconds after which autosave is triggered */
		/* timestamps ("fixed"|"dynamic"|"off") - "fixed": default behaviour, "dynamic": makes timestamps visible only when the mouse cursor hovers over chat messages, "off": hides timestamps */
		KonzenChat = {
			"version": "2.0.6",
			"expandBy": 220,
			"localStorage": true,
			"localStorageSize": 15,
			"autosave": 10,
			"timestamps": "fixed"
		};
		/* Begin */
		define_scrollIntoViewIfNeeded();
		if (window.localStorage !== undefined) {
			if (localStorage.getItem('options') === null) {
				KonzenChat.options = new options();
				localStorage.setItem('options', JSON.stringify(KonzenChat.options));
			} else {
				KonzenChat.options = JSON.parse(localStorage.getItem('options'));
				if (KonzenChat.version > KonzenChat.options.version) {
					/*localStorage.removeItem('session');*/
					KonzenChat.options.version = KonzenChat.version;
					localStorage.setItem('options', JSON.stringify(KonzenChat.options));
				}
				KonzenChat.timestamps = KonzenChat.options.timestamps;
			}
		}
		if (KonzenChat.localStorage == true) {
			if (window.localStorage === undefined)
				KonzenChat.localStorage = false;
			else {
				KonzenChat.autosave *= 10;
				load_backlog(0);
			}
		}
		if (KonzenChat.search_bar_game != "yes") {
			build_UI(0);
			KonzenChat.search_bar_game = "yes";
			if (document.getElementsByClassName('btn btn_tools btn_target pan')[1] !== undefined) {
				build_UI(1);
				KonzenChat.search_bar_room = "yes";
			} else {
				document.getElementsByClassName('unread_chat_messages spriteall spritegame')[0].parentNode.onclick = function (event) {
					if (KonzenChat.search_bar_room != "yes") {
						KonzenChat.timeout = setTimeout(function () {
							create_search_bar_delayed()
						}, 300);
					}
				}
			}
		}
		document.initialized = true;
	}
	toggle_chat_width();
}

function options() {
	this.version = KonzenChat.version;
	this.timestamps = KonzenChat.timestamps;
}

function toggle_chat_width() {
	var cc = document.getElementById('chat_container');
	var ct = document.getElementById('chat_tab_pane');
	var ci = document.getElementsByClassName('chat_input');
	var c1 = ci[1],
		c2 = ci[2];
	var m = document.getElementById('maingame');
	var e = KonzenChat.expandBy;
	if (KonzenChat.expanded != true) {
		cc.style.width = (cc.offsetWidth + e) + "px";
		ct.style.width = "inherit";
		c1.style.width = (280 + e) + "px";
		if (c2 !== undefined) {
			c2.style.width = (280 + e) + "px";
		}
		m.style.paddingRight = (10 + e) + "px";
		KonzenChat.expanded = true;
	} else {
		cc.style.width = (cc.offsetWidth - e) + "px";
		ct.style.width = null;
		c1.style.width = null;
		if (c2 !== undefined) {
			c2.style.width = null;
		}
		m.style.paddingRight = null;
		KonzenChat.expanded = false;
	}
}

function load_backlog(chat_room_number) {
	var session = localStorage.getItem('session');
	if (session !== null) {
		var backlog = JSON.parse(session);
		var chat = document.getElementsByClassName('chat_message_window')[chat_room_number + 1];
		var div = document.createElement("div");
		div.innerHTML = backlog.value;
		var i = div.childElementCount - 1;
		while (i >= 0) {
			chat.insertBefore(div.childNodes[i], chat.firstChild);
			i--;
		}
		/* scroll last message into view */
		var messages = chat.getElementsByClassName('chat-message');
		messages[messages.length - 1].scrollIntoViewIfNeeded();
	}
}

function save_backlog(chat) {
	var backlog = {
		"value": ""
	};
	var i = chat.length - KonzenChat.localStorageSize;
	while (i < chat.length) {
		if (chat[i] !== undefined) {
			backlog.value += "<div class=\"chat-message\">" + chat[i].innerHTML + "</div>";
		}
		i++;
	}
	localStorage.setItem('session', JSON.stringify(backlog));
}

function build_UI(chat_room_number) {
	create_search_bar(chat_room_number);
	add_menu_actions(chat_room_number);
}

function create_search_bar(chat_room_number) {
	var textarea_n = "textarea" + chat_room_number;
	var textarea = document.createElement("textarea");
	setAttributes(textarea, {
		"class": "textarea",
		"style": "position:absolute; right:60px; width:100px; height:13px; font-family:verdana; resize:none; border:none;",
		"maxlength": "10",
		"placeholder": "Search key..."
	});
	KonzenChat[textarea_n] = {
		"i": 0,
		"search_key": "letmeaddtimestamps",
		"results": 0
	};
	/* localStorage */
	if (KonzenChat.localStorage == true && chat_room_number == 0) {
		KonzenChat[textarea_n].autosave = KonzenChat.autosave;
		/*KonzenChat[textarea_n].saved = false;*/
	}
	textarea.onkeydown = function (event) {
		var t = event.currentTarget;
		/* Enter */
		if (event.keyCode == "13") {
			event.preventDefault();
		} /* Tab */
		else if (event.keyCode == "9") {
			event.preventDefault();
			t.parentNode.getElementsByClassName("spritesite friend_icon")[0].click();
		} /* Other keys */
		else {
			if (t.getAttribute("u") != "on") {
				KonzenChat[textarea_n].i = 0;
				KonzenChat[textarea_n].results = 0;
				clearTimeout(KonzenChat[textarea_n].timeout);
				/* Escape */
				if (event.keyCode == "27") {
					event.preventDefault();
					t.value = "";
					find(t, chat_room_number);
				} else {
					/* requires min time for t.value to update */
					KonzenChat[textarea_n].timeout = setTimeout(function () {
						find(t, chat_room_number)
					}, 10);
				}
			} else {
				/* Escape */
				if (event.keyCode == "27") {
					event.preventDefault();
					t.value = "";
					find_users(t, chat_room_number);
				} else {
					/* requires min time for t.value to update */
					setTimeout(function () {
						find_users(t, chat_room_number)
					}, 10);
				}
			}
		}
	};
	var tempNode = document.getElementsByClassName('btn btn_tools btn_target pan')[chat_room_number];
	tempNode.parentNode.insertBefore(textarea, tempNode);
	var span = document.createElement("span");
	setAttributes(span, {
		"class": "spritesite friend_icon",
		"style": "width: 13px;height: 13px;background-position: 100.1%  -2388px;text-indent: -9999px;right: 167px;position: absolute;border: outset;"
	});
	span.onclick = function (event) {
		var x = "width: 13px;height: 13px;background-position: 100.1%  -2388px;text-indent: -9999px;right: 167px;position: absolute;border: ";
		var t = event.currentTarget.parentNode.childNodes[1];
		t.value = "";
		if (span.getAttribute("is") != "on") {
			setAttributes(span, {
				"is": "on",
				"style": x + "inset;"
			});
			setAttributes(t, {
				"u": "on"
			});
			if (KonzenChat[textarea_n].search_key != "letmeaddtimestamps" && KonzenChat[textarea_n].results == 0)
				setAttributes(t, {
					"style": "position:absolute; right:60px; width:100px; height:13px; font-family:verdana; resize:none; border:none;"
				});
		} else {
			setAttributes(span, {
				"is": "off",
				"style": x + "outset;"
			});
			setAttributes(t, {
				"u": "off"
			});
			find_users(t, chat_room_number);
			if (KonzenChat[textarea_n].search_key != "letmeaddtimestamps") {
				t.value = KonzenChat[textarea_n].search_key;
				if (KonzenChat[textarea_n].results == 0)
					setAttributes(t, {
						"style": "position:absolute; right:60px; width:100px; height:13px; font-family:verdana; resize:none; border:none; background-color:pink;"
					});
			}
		}
		t.focus();
	};
	tempNode.parentNode.insertBefore(span, tempNode);
	find(textarea, chat_room_number);
}

function create_search_bar_delayed() {
	if (document.getElementsByClassName('btn btn_tools btn_target pan')[1] === undefined) {
		clearTimeout(KonzenChat.timeout);
		setTimeout(function () {
			create_search_bar_delayed()
		}, 100);
	} else {
		build_UI(1);
		KonzenChat.search_bar_room = "yes";
		clearTimeout(KonzenChat.timeout);
		delete(KonzenChat.timeout);
		if (KonzenChat.expanded == true) {
			var chat_input = document.getElementsByClassName('chat_input');
			chat_input[2].setAttribute("style", chat_input[1].getAttribute("style"));
		}
	}
}

function add_menu_actions(chat_room_number) {
	var cl = document.getElementsByClassName("chat_actions_list")[chat_room_number];
	cl.style.minWidth = "157px";
	add_action_timestamps(cl);
	add_action_toggle_chat_width(cl);
}

function add_action_timestamps(cl) {
	var msg = KonzenChat.timestamps.charAt(0).toUpperCase() + KonzenChat.timestamps.slice(1);
	var li = document.createElement("li");
	li.textContent = "Timestamps ▼";
	li.onclick = function (event) {
		event.target.childNodes[1].toggle();
		event.stopPropagation();
	};
	/* submenu */
	var ul = document.createElement("ul");
	setAttributes(ul, {
		"class": "chat_actions_list",
		"style": "top:0; position:relative; margin-left:-15px; margin-right:-15px;"
	});
	ul.onclick = function (event) {
		event.stopPropagation();
	};
	ul.toggle();
	/* entry 1 */
	var li_fix = document.createElement("li");
	add_action_timestamps_make_option(cl, li_fix, "fixed");
	/* entry 2 */
	var li_dyn = document.createElement("li");
	add_action_timestamps_make_option(cl, li_dyn, "dynamic");
	/* entry 3 */
	var li_off = document.createElement("li");
	add_action_timestamps_make_option(cl, li_off, "off");

	ul.appendChild(li_fix);
	ul.appendChild(li_dyn);
	ul.appendChild(li_off);
	li.appendChild(ul);
	cl.appendChild(li);
}

function add_action_timestamps_make_option(cl, li, value) {
	li.textContent = "Set: " + value.charAt(0).toUpperCase() + value.slice(1);
	li.onclick = function (event) {
		KonzenChat.timestamps = value;
		add_action_timestamps_onclick_helper(0);
		if (KonzenChat.search_bar_room == "yes") {
			add_action_timestamps_onclick_helper(1);
		}
		if (window.localStorage !== undefined) {
			KonzenChat.options.timestamps = value;
			localStorage.setItem('options', JSON.stringify(KonzenChat.options));
		}
		event.target.parentNode.toggle();
		cl.toggle();
		event.stopPropagation();
	};
}

function add_action_timestamps_onclick_helper(chat_room_number) {
	var textarea_n = "textarea" + chat_room_number;
	var textarea = document.getElementsByClassName('textarea')[chat_room_number];
	KonzenChat[textarea_n].i = 0;
	KonzenChat[textarea_n].results = 0;
	clearTimeout(KonzenChat[textarea_n].timeout);
	find(textarea, chat_room_number);
}

function add_action_toggle_chat_width(cl) {
	var li = document.createElement("li");
	li.innerHTML = "Toggle chat width";
	li.onclick = function (event) {
		toggle_chat_width();
		/* scroll last message into view (fix issue when shrinking) */
		var chat_room_number = document.getElementById('game_room_tab').className == "chat_room_tab active" ? 0 : 1;
		var chat = document.getElementsByClassName('chat_message_window')[chat_room_number + 1];
		var messages = chat.getElementsByClassName('chat-message');
		messages[messages.length - 1].scrollIntoViewIfNeeded();
	};
	cl.appendChild(li);
}

function find_users(textarea, chat_room_number) {
	var u = document.getElementsByClassName('chat_tabpane users_in_room clear')[chat_room_number + 1];
	var i = 0;
	while (i < u.childElementCount - 1) {
		var n = u.childNodes[i].childNodes[1].childNodes[3];
		n.parentNode.parentNode.style.display = n.textContent.toLowerCase().search(textarea.value.toLowerCase()) == -1 ? "none" : null;
		i++;
	}
}

function find(textarea, chat_room_number) {
	/* if check fails, try to reconnect */
	if (document.getElementsByClassName('chat_message_window')[chat_room_number + 1] === undefined) {
		KonzenChat.timeout = setTimeout(function () {
			find_reconnect_delayed()
		}, 1000);
		return;
	}
	var textarea_n = "textarea" + chat_room_number;
	var chat = document.getElementsByClassName('chat_message_window')[chat_room_number + 1].getElementsByClassName("chat-message");
	var i = KonzenChat[textarea_n].i;
	if (chat[i] !== undefined) {
		var parentNode = chat[i].childNodes[0];
		var msg = parentNode.getElementsByClassName("message hyphenate")[0];
		/* timestamps */
		find_timestamps(parentNode, chat, i);
		/* hyperlinks */
		find_hyperlinks(parentNode, msg);
		/* postponed search mechanism */
		find_search(parentNode, msg, textarea, textarea_n, i);
		/* increment to visit next element */
		i++;
		/* localStorage */
		if (KonzenChat.localStorage == true && chat_room_number == 0) {
			/* reset autosave timer */
			KonzenChat[textarea_n].autosave = KonzenChat.autosave;
			/* save every 8 messages */
			/* 1 performance issue: if users type in search area (or clear search) when the condition below is met, then chat is saved again */
			if (!(i & 7) && i >= chat.length - 1) {
				save_backlog(chat);
				KonzenChat[textarea_n].saved = true;
			} else {
				KonzenChat[textarea_n].saved = false;
			}
		}
		KonzenChat[textarea_n].i = i;
		find(textarea, chat_room_number);
	} else {
		/* localStorage */
		if (KonzenChat.localStorage == true && chat_room_number == 0) {
			/* autosave */
			KonzenChat[textarea_n].autosave--;
			if (KonzenChat[textarea_n].autosave == 0) {
				if (chat.length > 0 && KonzenChat[textarea_n].saved != true) {
					save_backlog(chat);
					KonzenChat[textarea_n].saved = true;
				}
				KonzenChat[textarea_n].autosave = KonzenChat.autosave;
			}
		}
		KonzenChat[textarea_n].timeout = setTimeout(function () {
			find(textarea, chat_room_number)
		}, 100);
	}
}

function find_reconnect_delayed() {
	if (KonzenChat.search_bar_room == "yes") {
		if (document.getElementsByClassName('btn btn_tools btn_target pan')[1] !== undefined) {
			build_UI(0);
			build_UI(1);
			load_backlog(1);
			clearTimeout(KonzenChat.timeout);
			delete(KonzenChat.timeout);
			toggle_chat_width();
			toggle_chat_width();
		} else {
			clearTimeout(KonzenChat.timeout);
			setTimeout(function () {
				find_reconnect_delayed()
			}, 100);
		}
	} else {
		if (document.getElementsByClassName('btn btn_tools btn_target pan')[0] !== undefined) {
			build_UI(0);
			load_backlog(0);
			clearTimeout(KonzenChat.timeout);
			delete(KonzenChat.timeout);
			toggle_chat_width();
			toggle_chat_width();
		} else {
			clearTimeout(KonzenChat.timeout);
			setTimeout(function () {
				find_reconnect_delayed()
			}, 100);
		}
	}
}

function find_timestamps(parentNode, chat, i) {
	var timestamp = parentNode.getElementsByClassName("timestamp")[0];
	/* case "fixed" */
	if (KonzenChat.timestamps == "fixed") {
		/* Show timestamps only when message time changes */
		if (chat[i - 1] === undefined || chat[i - 1].childNodes[0].getElementsByClassName("timestamp")[0].innerHTML != timestamp.innerHTML) {
			timestamp.style.display = null;
		}
		parentNode.onmouseenter = null;
		parentNode.onmouseleave = null;
	} /* case "dynamic" */
	else if (KonzenChat.timestamps == "dynamic") {
		timestamp.style.display = "none";
		parentNode.onmouseenter = function (event) {
			event.target.getElementsByClassName("timestamp")[0].style.display = null;
		};
		parentNode.onmouseleave = function (event) {
			event.target.getElementsByClassName("timestamp")[0].style.display = "none";
		};
	} /* case "off" */
	else {
		timestamp.style.display = "none";
		parentNode.onmouseenter = null;
		parentNode.onmouseleave = null;
	}
}

/* hyperlinks (currently handles only 1st hyperlink in message) */
function find_hyperlinks(parentNode, msg) {
	var regex = /([a-z])\w+:\/\/\S+/g;
	var result = msg.textContent.match(regex);
	/* if msg contains no URL */
	if (result == null) {
		return;
	}
	var aColl = parentNode.getElementsByTagName("a");
	/* if hyperlink isn't already added or msg is a whisper */
	if (aColl.length == 0 || aColl.length == 1 && aColl[0].className == "reply_link") {
		/* create hyperlink */
		var a = document.createElement("a");
		a.textContent = result[0];
		setAttributes(a, {
			"href": result[0],
			"target": "_blank"
		});
		/* create new innerHTML for msg */
		var index = msg.innerHTML.indexOf(result[0]);
		var newInnerHTML = msg.innerHTML.substr(0, index) + a.outerHTML + msg.innerHTML.substr(index + result[0].length);
		/* set msg content */
		msg.innerHTML = newInnerHTML;
	}
}

function find_search(parentNode, msg, textarea, textarea_n, i) {
	/* store search_key on first message iteration */
	if (i == 0) {
		var search_key = textarea.value.toLowerCase();
		KonzenChat[textarea_n].search_key = search_key == "" ? "letmeaddtimestamps" : search_key;
	}
	/* match with search_key */
	if (msg.textContent.toLowerCase().search(KonzenChat[textarea_n].search_key) != -1) {
		parentNode.style.background = "pink";
		KonzenChat[textarea_n].results += 1;
	} else {
		parentNode.style.background = null;
	}
	/* update textarea style */
	textarea.style.background = KonzenChat[textarea_n].results == 0 && KonzenChat[textarea_n].search_key != "letmeaddtimestamps" ? "pink" : null;
}

/* Utilities */

function setAttributes(e, attrs) {
	for (var key in attrs) {
		e.setAttribute(key, attrs[key]);
	}
}

function define_scrollIntoViewIfNeeded() {
	if (!Element.prototype.scrollIntoViewIfNeeded) {
		Element.prototype.scrollIntoViewIfNeeded = function (centerIfNeeded) {
			centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

			var parent = this.parentNode,
				parentComputedStyle = window.getComputedStyle(parent, null),
				parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width')),
				parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width')),
				overTop = this.offsetTop - parent.offsetTop < parent.scrollTop,
				overBottom = (this.offsetTop - parent.offsetTop + this.clientHeight - parentBorderTopWidth) > (parent.scrollTop + parent.clientHeight),
				overLeft = this.offsetLeft - parent.offsetLeft < parent.scrollLeft,
				overRight = (this.offsetLeft - parent.offsetLeft + this.clientWidth - parentBorderLeftWidth) > (parent.scrollLeft + parent.clientWidth),
				alignWithTop = overTop && !overBottom;

			if ((overTop || overBottom) && centerIfNeeded) {
				parent.scrollTop = this.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + this.clientHeight / 2;
			}

			if ((overLeft || overRight) && centerIfNeeded) {
				parent.scrollLeft = this.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + this.clientWidth / 2;
			}

			if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
				this.scrollIntoView(alignWithTop);
			}
		};
	}
}

//# sourceURL=dynamicScript.js
