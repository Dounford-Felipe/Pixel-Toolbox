// ==UserScript==
// @name         IP Dounford Scripts Styles
// @version      1.0.0
// @description  Centralize IP Dounford Styles
// @author       Dounford
// @license      MIT
// @match        *://idle-pixel.com/login/play*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';
	function isNewerVersion () {
		const oldParts = document.getElementById('dounfordStyles').getAttribute('version').split('.')
		const newParts = GM_info.script.version.split('.')
		for (let i = 0; i < newParts.length; i++) {
			const a = ~~newParts[i]
			const b = ~~oldParts[i]
			if (a > b) return true
			if (a < b) return false
		}
		return false
	}

	(function addStyles() {
		let style = document.createElement('style');
		style.id = "dounfordStyles"
		style.setAttribute('version', GM_info.script.version)
		styleHTML = `
		dialog::backdrop {
			background-color: rgba(0, 0, 0, 0.855);
		}
		.dounfordModal {
			padding: 0;
			width: 500px;
			background-color: #e5e5e5;
			border-radius: 0.5rem;
		}
		.dounfordModalHeader {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 1rem;
			border-bottom: 1px solid #ccc;
		}
		.dounfordModalBody {
			padding: 1rem;
			text-align: center;
		}
		.dounfordModalFooter {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			padding: 0.75rem;
			border-top: 1px solid #ccc;
		}
		.dounfordModalFooter > * {
			margin: 0.25rem;
		}`;

		if (document.getElementById('dounfordStyles')) {
			if (!isNewerVersion()) return
			document.getElementById('dounfordStyles').innerHTML = styleHTML
			document.getElementById('dounfordStyles').setAttribute('version', GM_info.script.version)
		} else {
			style.innerHTML = styleHTML
			document.head.appendChild(style);
		}	
	})()
})()