// ==UserScript==
// @name         Pixel Shop+
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Makes it easier to create new custom shops for Idle Pixel
// @author       Dounford
// @license      MIT
// @match        *://idle-pixel.com/login/play*
// @grant        none
// ==/UserScript==

/*newCoinFormat = {
	name:'testCoin',
	image:'https://raw.githubusercontent.com/Dounford-Felipe/DHP-Pets/main/images/goldenHeart.gif',
	value:2000
}
*/

//newShopFormat = PixelShopPlus.newShop('fish','testCoin')

/*newItemFormat = [{
	name:"blueCat",
	imageUrl:"https://raw.githubusercontent.com/Dounford-Felipe/DHP-Pets/main/images/blueCat.png",
	coin:"testCoin",
	price:1000,
	tooltipText:"<span class='color-primary'>Blue Cat</span><br /><br />This cute cat wants to be your friend",
	buyText:"Adopt this cat to be your friend",
	boughtText:"Charlie will forever love you",
	bought:false,
	callback: function(){IdlePixelPlus.plugins.test.bought(pirate)}
}]*/

(function PixelShopPlus() {
    'use strict';
	const PixelShopPlus = {
		shops: ['vanilla'],
		coins: {},
		items: {},
		initialize: function () {
            window.addEventListener('load', function () {
                PixelShopPlus.newModals();
                PixelShopPlus.newShopDivs();
                //PixelShopPlus.loadCoins();
            });
        },
		
		//Creates 
		newModals: function () {
			let customShopModalDiv = `<div style="width: 100%; height: 100%; position: absolute;top:0px; display: none;" id="customShopModalParent">
				<div style="background-color: black;opacity: 0.7;width: 100%;height: 100%;position: absolute;" onclick="document.getElementById('customShopModalParent').style.display='none'"></div>
				<div class="modal-content" id="customShopModal" style="z-index: 11;position: sticky;right: 0px;left: 0px;margin-right: auto;margin-left: auto;width: 35%;border-radius: 5px;top: 100px;">
					<div class="modal-header">
						<h5 class="modal-title text-secondary">Purchase Item</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onclick="document.getElementById('customShopModalParent').style.display='none'"></button>
						<input type="hidden" id="customShopModalShop">
						<input type="hidden" id="customShopModalItem">
					</div>
					<div class="modal-body">
						<span>
						  <center>
							<img id="customShopModalImage" style="height:100px" src="" title="balance">
						  </center>
						  <br>
						  <br>
						</span>
						<div class="center" id="customShopModalText"></div>
					</div>
					<div class="modal-footer">
					  <button onclick="document.getElementById('customShopModalParent').style.display='none'"><span class="font-pixel hover">Cancel</span></button>
					  <button id="customShopModalBuy" class="background-primary" style=""><span class="font-pixel hover">Purchase</span></button>
					</div>
				</div>
			</div>`
			document.getElementById('content').insertAdjacentHTML('beforeend', customShopModalDiv);
			document.getElementById('customShopModalBuy').addEventListener('click', PixelShopPlus.buyItem);
		},
		
		//Adds the change shop button
		newShopDivs: function () {
			let shopButton = document.createElement('div');
			shopButton.id = "shopButtons";
			shopButton.style.cssText = "white-space: nowrap; overflow-x: auto;";
			shopButton.innerHTML = `<div id="vanilla-shop" onclick="PixelShopPlus.changeShopTabs('vanilla')" style="background-color: rgb(247, 122, 129); white-space: normal;" class="quest-tab-button hover">
				VANILLA SHOP
			</div>`
			let vanillaShop = document.createElement('div');
			vanillaShop.id = "vanillaShop";
			while (document.getElementById('panel-shop').firstChild) {
				vanillaShop.appendChild(document.getElementById('panel-shop').firstChild);
			}
			document.getElementById('panel-shop').appendChild(shopButton);
			document.getElementById('panel-shop').insertAdjacentHTML('beforeend', '<hr>');
			document.getElementById('panel-shop').appendChild(vanillaShop);
		},
		
		//Change which shop is shown
		changeShopTabs: function(value) {
			// Oculta todos os tabs e remove o destaque
			for (const shopId of PixelShopPlus.shops) {
				document.getElementById(shopId + 'Shop').style.display = "none";
				document.getElementById(shopId + '-shop').style.backgroundColor = "";
			}

			document.getElementById(value + 'Shop').style.display = "";
			document.getElementById(value + '-shop').style.backgroundColor = "#f77a81";
		},
		
		//Register a new coin
		newCoin: function(coin) {
			if (typeof PixelShopPlus.coins[coin.name] == 'undefined') {
				PixelShopPlus.coins[coin.name] = {image:coin.image,value:coin.value}
			}
		},
		
		//Increase the value of a coin
		coinIncrease: function(coin,increase) {
			PixelShopPlus.coins[coin].value += increase
			if (document.querySelector('[coin-value="' + coin + '"]')) {
				let coinElements = document.querySelectorAll('[coin-value="' + coin + '"]');
				coinElements.forEach(function(coinElement) {
					coinElement.textContent = PixelShopPlus.coins[coin].value.toLocaleString("en-US");
				});
			}
		},
		
		//Decrease the value of a coin
		coinDecrease: function(coin,decrease) {
			PixelShopPlus.coins[coin].value -= decrease
			if (document.querySelector('[coin-value="' + coin + '"]')) {
				let coinElements = document.querySelectorAll('[coin-value="' + coin + '"]');
				coinElements.forEach(function(coinElement) {
					coinElement.textContent = PixelShopPlus.coins[coin].value.toLocaleString("en-US");
				});
			}
		},
		
		//Set the value of a coin
		coinSet: function(coin,setValue) {
			PixelShopPlus.coins[coin].value = setValue
			if (document.querySelector('[coin-value="' + coin + '"]')) {
				let coinElements = document.querySelectorAll('[coin-value="' + coin + '"]');
				coinElements.forEach(function(coinElement) {
					coinElement.textContent = PixelShopPlus.coins[coin].value.toLocaleString("en-US");
				});
			}
		},
		
		//Register a new shop
		newShop: function (shop,coin) {
			PixelShopPlus.shops.push(shop);
			PixelShopPlus.items[shop] = {};
			let newTabButton = document.createElement('div');
			newTabButton.id = shop + "-shop";
			newTabButton.className = "quest-tab-button hover";
			newTabButton.style.marginLeft = "20px";
			newTabButton.innerHTML = shop.toLocaleUpperCase() + ' SHOP';
			newTabButton.onclick = function() {
				PixelShopPlus.changeShopTabs(shop);
			};
			document.getElementById('shopButtons').appendChild(newTabButton);
			
			let newShopPanel = document.createElement('div');
			newShopPanel.id = shop + "Shop"
			newShopPanel.style.display = "none"
			newShopPanel.innerHTML  = `<h1>${shop.toLocaleUpperCase()} SHOP</h1>`
			if (typeof coin == 'string') {
				let newCoinImage = document.createElement('img');
				newCoinImage.src = PixelShopPlus.coins[coin].image
				newCoinImage.className = "w20"
				let newCoinValue = document.createElement('span');
				newCoinValue.setAttribute('coin-value', coin)
				newCoinValue.innerText = PixelShopPlus.coins[coin].value.toLocaleString("en-US")
				newShopPanel.appendChild(newCoinImage);
				newShopPanel.appendChild(newCoinValue);
			}
			newShopPanel.insertAdjacentHTML('beforeend', '<hr>');
			document.getElementById('panel-shop').appendChild(newShopPanel);
		},
		
		//Register an array of new buyable items
		newItems: function(shop,items) {
			items.forEach(function(item) {
				PixelShopPlus.items[shop][item.name] = item;
				if (item.bought == false) {
					let newShopItem = `<div id="shop-${item.name}" onclick="PixelShopPlus.openBuyModal('${shop}','${item.name}')" class="game-shop-box hover shadow" data-tooltip="shop-${item.name}" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" title="" data-bs-original-title="${item.tooltipText}">
						<div class="center mt-1">
							<img src="${item.imageUrl}" title="${item.name}" style="height: 50px;">
						</div>
						<div class="center mt-1">
							<img src="${PixelShopPlus.coins[item.coin].image}" title="${item.coin}" class="w20">
							<span id="${item.name}-shop-cost">${format_number(item.price)}</span>
						</div>
				   </div>`
					document.getElementById(shop + 'Shop').insertAdjacentHTML('beforeend',newShopItem)
				   $('#shop-' + item.name).tooltip()
				}
			})
		},
		
		//Open Buy Confirm
		openBuyModal: function(shop,item) {
			document.getElementById('customShopModalShop').value = shop;
			document.getElementById('customShopModalItem').value = item;
			document.getElementById('customShopModalImage').src = PixelShopPlus.items[shop][item].imageUrl;
			document.getElementById('customShopModalText').innerText = PixelShopPlus.items[shop][item].buyText;
			document.getElementById('customShopModalBuy').style.display='';
			document.getElementById('customShopModalParent').style.display='';
		},
		
		//Buy Item
		buyItem: function() {
			let shop = document.getElementById('customShopModalShop').value;
			let item = document.getElementById('customShopModalItem').value;
			let price = PixelShopPlus.items[shop][item].price
			let coin = PixelShopPlus.items[shop][item].coin;
			if (PixelShopPlus.coins[coin].value >= price) {
				PixelShopPlus.coinDecrease(coin,price);
				PixelShopPlus.items[shop][item].bought = true;
				document.getElementById('shop-' + item).style.display = "none";
				document.getElementById('customShopModalBuy').style.display="none";
				document.getElementById('customShopModalText').innerText = PixelShopPlus.items[shop][item].boughtText;
				if(PixelShopPlus.items[shop][item].callback !== "") {
					PixelShopPlus.items[shop][item].callback()
				}
			} else {
				document.getElementById('customShopModalBuy').style.display='none';
				document.getElementById('customShopModalText').innerText = "You can't afford this, sorry.";
			}
		},
		
		//Save the coin amount on localstorage
		saveCoins: function() {
			let key = `ShopPlus-${var_username}`;
			localStorage.setItem(key, JSON.stringify(PixelShopPlus.coins));
		},
		
		//Load the coin amount on localstorage
		loadCoins: function() {
			let key = `ShopPlus-${var_username}`;
			let loadedCoins = localStorage.getItem(key);
			if (loadedCoins) {
				PixelShopPlus.coins = JSON.parse(loadedCoins);
			}
		},
	};
	window.PixelShopPlus = PixelShopPlus;
	PixelShopPlus.initialize();
})();