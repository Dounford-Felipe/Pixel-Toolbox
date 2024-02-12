// ==UserScript==
// @name         Pixel Quests+
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Makes it easier to create new custom quests for Idle Pixel
// @author       Dounford
// @license      MIT
// @match        *://idle-pixel.com/login/play*
// @grant        none
// @require      https://greasyfork.org/scripts/441206-idlepixel/code/IdlePixel+.js
// ==/UserScript==

(function() {
    'use strict';

    class QuestsPlugin extends IdlePixelPlusPlugin {
        constructor() {
            super("quests", {
                about: {
                    name: GM_info.script.name,
                    version: GM_info.script.version,
                    author: GM_info.script.author,
                    description: GM_info.script.description
                }
            });
        this.tabs = ['story', 'optional']
		}

        onLogin() {
            IdlePixelPlus.plugins.quests.newQuestButtons();
        }
		
		newQuestButtons() {
			questButtons = document.createElement('div');
			questButtons.id = "questsButtons";
			questButtons.style.cssText = "white-space: nowrap; overflow-x: auto;";
			document.getElementById('panel-quests').prepend(questButtons);
			questButtons.appendChild(document.getElementById('story-quest-tab-button'));
			document.getElementById('story-quest-tab-button').style.whiteSpace = "normal";
			questButtons.appendChild(document.getElementById('optional-quest-tab-button'));
			document.getElementById('optional-quest-tab-button').style.whiteSpace = "normal";
		}
		
		changeQuestTabsFunction(tabs) {
			//Change Quest Class to Make the Quest Tab Button Work
			Quests.changeQuestTabs = function(value) {
				let questTabs = tabs;

				// Oculta todos os tabs e remove o destaque
				for (const tabId of questTabs) {
					document.getElementById(tabId + '-quest-tab').style.display = "none";
					document.getElementById(tabId + '-quest-tab-button').style.backgroundColor = "";
				}

				if (value == 'optional') {
					if(Items.getItem('optional_quests_unlocked') == 0) {
						document.getElementById('story-quest-tab').style.display = "";
						document.getElementById('story-quest-tab-button').style.backgroundColor = "#f77a81";
						Modals.open_image_modal('SIDE QUESTS', 'images/lock.png', 'Unlock side quests?  You need to complete at least 4 of the main story quests to unlock this.','Unlock Optional Quests!','Cancel','UNLOCK_OPTIONAL_QUESTS');
						return;
					}
					document.getElementById('optional-quest-tab').style.display = "";
					document.getElementById('optional-quest-tab-button').style.backgroundColor = "#f77a81";
				} else {
					document.getElementById(value + '-quest-tab').style.display = "";
					document.getElementById(value + '-quest-tab-button').style.backgroundColor = "#f77a81";
				}
			}
		}
		
		newQuestType(type,description) {
			IdlePixelPlus.plugins.quests.tabs.push(type);
			newTabButton = document.createElement('div');
			newTabButton.id = type + "-quest-tab-button";
			newTabButton.className = "quest-tab-button hover";
			newTabButton.style.marginLeft = "20px";
			newTabButton.innerHTML = `${type.toLocaleUpperCase()} QUESTS
				<span style="margin-left:20px;" id="${type}-quest-tab-button-label">
					<span class="color-yellow">0/0</span>
				</span>`;
			newTabButton.onclick = function() {
				Quests.changeQuestTabs(type);
			};
			document.getElementById('questsButtons').appendChild(newTabButton);
			
			let newTabPanel = document.createElement('div');
			newTabPanel.id = type + "-quest-tab"
			newTabPanel.style.display = "none"
			newTabPanel.className = "quest-tabs"
			newTabPanel.innerHTML = `<h1 style="color:#f77a81">${type.toLocaleUpperCase()} QUESTS</h1>
				<span>${description}</span>
				<hr>
				<div id="${type}-quest-area"></div>`
			document.getElementById('panel-quests').appendChild(newTabPanel);
			
			changeQuestTabsFunction(IdlePixelPlus.plugins.quests.tabs);
		}
    }

    const plugin = new SamplePlugin();
    IdlePixelPlus.registerPlugin(plugin);

})();