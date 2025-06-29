// ==UserScript==
// @name         Mobile Combat+
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Custom enemies for Diamond Hunt Mobile
// @author       Dounford
// @license      MIT
// @match        *://dhm.idle-pixel.com/*
// @grant        none
// ==/UserScript==
/*jshint esversion: 8 */

const customEnemies = {
	chicken: {
		name: "chicken",
		displayName: "Chicken",
		image: "images/chickenMonster.png"
	}
};
const defaultEnemy = {
	name: "Test",
	image: "https://example.com/example.png",
	hp: 10,
	maxHp: 10,
	damage: 2,
	accuracy: 3,
	defence: 5,
	multiPhase: false,
	nextPhase: null,
	arrowImunity: false,
	magicImunity: false,
	weakToFire: false,
	weakToIce: false,
	poisoned: false,
	ghost: false,
	fish: false,
	defender: false,
	isInvisible: 0,
	isCharging: 0,
	abilities: [
		{type: 'heal', limit: -1, chance: 1, cooldown: 3, min:5, max:20, startingCooldown:10},
		{type: 'poison', limit: 1, chance: 1, damage:5, startingCooldown:5},
		{type: 'damage', limit: -1, chance: 0.25, cooldown: 3, min:5, max:20, startingCooldown:3},
		{type: 'kamikaze', chance: 1, startingCooldown: 120},
		{type: 'invisibility', limit: -1, chance: 1, cooldown: 30, startingCooldown:30},
		{type: 'reflect', limit: -1, chance: 1, cooldown: 15, startingCooldown:15}
	],
	lootTable: null,
	lootFunction: null,
	winFunction: null,
};

(function IdleFight() {
	'use strict';

	//Variables
	/*abilities: [
		{type: 'heal', limit: -1, chance: 1, cooldown: 3, min:5, max:20, startingCooldown:10},
		{type: 'poison', limit: 1, chance: 1, damage:5, startingCooldown:5},
		{type: 'damage', limit: -1, chance: 0.25, cooldown: 3, min:5, max:20, startingCooldown:3},
		{type: 'kamikaze', chance: 1, startingCooldown: 120},
		{type: 'invisibility', limit: -1, chance: 1, cooldown: 30, startingCooldown:30},
		{type: 'reflect', limit: -1, chance: 1, cooldown: 15, startingCooldown:15}
	]*/
	//[{item:'',image:'',min:1,max:10,chance:'1/x'}]

	const IdleFight = {
		fightStats: {
			explorerCooldown: 0,
			
			//Fighting toggle
			fighting: false,

			//Interval called each second
			ticking: 0,
			ticks: 0,

			//Timers
			cooldowns: {
				startsIn: 0,
				enemyIsInvisible: 0,
				enemyIsCharging: 0
			},
			
			//Hitsplat Maps
			hitSplatHero: {},
			hitSplatEnemy: {},

			//Enemy Stats
			enemy: {
				name: "test",
				displayName: "Test",
				image: "",
				description: "",
				hp: 10,
				maxHp: 10,
				damage: 2,
				accuracy: 3,
				defence: 5,
				multiPhase: false,
				nextPhase: null,
				isReflecting: false,
				arrowImunity: false,
				magicImunity: false,
				weakToFire: false,
				weakToIce: false,
				poisoned: false,
				ghost: false,
				fish: false,
				defender: false,
				abilities: null,
				lootTable: null,
				lootFunction: null,
				winFunction: null,
			},
			enemyImage: null,

			//Hero Stats
			hero: {
				hp:0,
				accuracy: 0,
				defence: 0,
				isReflecting: false,
				lifeSteal: 0,
				strengthPotion: false,
				poisoned: false,
				potions: {
					heal: true,
					freeze: true,
					accuracy: true,
					ghost: true,
					superHeal: true,
					strength: true
				},
				spells: {
					fire: 0,
					reflect: 0,
					teleport: 0,
					thunderStrike: 0,
					lifeSteal: 0,
					sandstorm: 0
				}
			},
		},

		onLogin() {
			Object.defineProperty(window, "defence", {
				get() {
					  return IdleFight.fightStats.hero.defence;
				},
				set(val) {
					IdleFight.fightStats.hero.defence = val;
				}
			});
			Object.defineProperty(window, "accuracy", {
				get() {
					  return IdleFight.fightStats.hero.accuracy;
				},
				set(val) {
					IdleFight.fightStats.hero.defence = val;
				}
			});
		},
			
		// :]
		testFight() {
			IdleFight.startFight(defaultEnemy)
		},
	
		// :]
		addUI() {
			const style = document.createElement("style");
			style.innerHTML = `
				.enemiesListGrid {
					display: grid;
					grid-template-columns: auto auto auto;

					> *:nth-child(odd) {
						background-color:black
					}

					> *:nth-child(even) {
						background-color:#1a1a1a
					}
				}
				.enemiesListDiv {
					display: flex;
					align-items: center;
					flex-direction: column;
					border: 1px solid grey;
					color: white;
				}
				.enemyListStats {
					border: 1px solid black;
					background-color: white;
					display: flex;
					justify-content: space-evenly;
					width: 75%;
					margin: auto;
				}
				/* Modal Style */
				dialog::backdrop {
					background-color: rgba(0, 0, 0, 0.855);
				}
				.dounfordModal {
					padding: 20;
					width: 400px;
					background-color: #e6e6ff;
					border-radius: 0.5rem;
					overflow: visible;
				}
				.dounfordModal label {
					margin-left: 5px;
				}
				.dounfordModalBody {
					padding: 1rem;
					text-align: center;
				}
				.dounfordModalFooter {
					display: flex;
					padding-bottom: 0.75rem;
					flex-direction: column;
				}
				.dounfordModalFooter > * {
					margin: 0.25rem;
					font-size: 12pt;
					height: 40px;
					width: 100%;
					border-radius: 6px;
					border: 1px solid black;
				}`

			document.head.appendChild(style);

			//Fight button that shows all custom enemies
			const idleFightButton = `<div id="IdleFightButton" class="main-button">
				<table>
					<tbody>
						<tr>
							<td onclick="navigate('customEnemiesList');" style="cursor: pointer;"><img src="images/silverScimitar.png" class="img-small"></td>
							<td onclick="navigate('customEnemiesList');" id="idleFightLabel" style="color: lime; cursor: pointer;" class="back-label">IDLE FIGHT</td>
						</tr>
					</tbody>
				</table>
			</div>`;
			document.getElementById("fight-button").insertAdjacentHTML('afterend', idleFightButton);
	
			//List of custom enemies
			const customEnemiesList = `<div id="tab-customEnemiesList" style="display: none;">
				<div class="main-button-lighter">
					<table>
						<tbody>
							<tr onclick="navigate('exploring');playPreviousMenuSound()" style="cursor: pointer;">
								<td><img src="images/back.png" class="img-small"></td>
								<td class="back-label">BACK</td>
							</tr>
						</tbody>
					</table>
				</div>
				<br>
				<div>
					<div style="margin:5 px 20px;color:orange;text-align:center;">Click on a monster to fight them.</div>
					<div class="enemiesListGrid" id="enemiesListGrid">
						
					</div>
				</div>
			</div>`
			document.getElementById("div-chat").insertAdjacentHTML('beforebegin', customEnemiesList);

			const enemiesKills = JSON.parse(localStorage.getItem("IdleCombatKills-" + username)) || {};
			for (ene in customEnemies) {
				const enemy = customEnemies[ene];
				const enemyKills = enemiesKills[enemy.name] || 0;
				const enemyDiv = document.createElement("div");
				enemyDiv.className = "enemiesListDiv";
				enemyDiv.innerHTML = `<img src="${enemy.image}">
					<span>${enemy.displayName}</span>
					<span><span id="customKills${enemy.name}">${enemyKills}</span> Kills</span>
				`
				enemyDiv.style.cursor = "pointer";
				enemyDiv.addEventListener("click", (e)=>{
					IdleFight.showCustomEnemy(ene);
				});
				document.getElementById("enemiesListGrid").insertAdjacentElement('beforeend', enemyDiv);
			};


		},
		
		newModals() {
			//Enemy Stats Modal
			let fightEnemyModal = `<dialog class="dounfordModal" id="fightCustomModal" onclick="event.target==this && this.close()">
				<input id="customMonsterHidden" type="hidden">
				<div class="dounfordModalBody">
					<img src="images/chickenMonster.png" id="fightCustomModalImage">
					<div class="enemyListStats">
						<span><img src="images/heartIcon.png" class="img-small"> <span id="fightCustomModalHp">0</span></span>
						<span><img src="images/attack.png" class="img-small"> <span id="fightCustomModalAttack">0</span></span>
						<span><img src="images/accuracy.png" class="img-small"> <span id="fightCustomModalAccuracy">0</span></span>
						<span><img src="images/defence.png" class="img-small"> <span id="fightCustomModalDefence">0</span></span>
					</div>
					<p id="fightCustomModalDescription">Enemy description</p>
				</div>
				<div class="dounfordModalFooter">
					<button style="background-color: rgb(42, 142, 142);cursor: pointer;" onclick="IdleCombat.startFight()">
						<span>Fight</span>
					</button>
					<button style="cursor: pointer;" onclick="this.parentNode.parentNode.close()">
						<span class="font-pixel hover">Cancel</span>
					</button>
				</div>
			</dialog>`
			document.querySelector(".game-screen").insertAdjacentHTML("afterbegin", fightEnemyModal);
			
			//Loot Modal wip
			let lootDiv = `<div style="width: 100%; height: 100%; position: absolute;top:0px; display: none;" id="customCombatModalParent">
				<div style="background-color: black;opacity: 0.7;width: 100%;height: 100%;position: absolute;" onclick="document.getElementById('customCombatModalParent').style.display='none'"></div>
				<div class="modal-content" id="customCombatModal" style="z-index: 11;position: sticky;right: 0px;left: 0px;margin-right: auto;margin-left: auto;width: 35%;border-radius: 5px;top: 100px;">
					<div class="modal-header">
						<h5 class="modal-title text-secondary">LOOT</h5>
						<button type="button" class="btn-close" onclick="document.getElementById('customCombatModalParent').style.display = 'none'"></button>
					</div>
					<div class="modal-body">
						<div id="modal-custom-loot-body">
						</div>
					</div>
					<div class="modal-footer">
						<button onclick="document.getElementById('customCombatModalParent').style.display = 'none'" id="modal-custom-loot-collect-button" class="background-primary"><span class="font-pixel hover">Collect Loot</span></button>
					</div>
				</div>
			</div>`
			document.getElementById('content').insertAdjacentHTML('beforeend', lootDiv);
		},
		
		//Adds the new combat scene :]
		newFightPanel() {
			const customCombatTab = `<div id="tab-customCombat" style="">
				<div class="main-button-lighter">
					<table>
						<tbody>
							<tr onclick="navigate('exploring');playPreviousMenuSound()" style="cursor: pointer;">
								<td><img src="images/back.png" class="img-small"></td>
								<td class="back-label">BACK</td>
							</tr>
						</tbody>
					</table>
				</div>
				<center>
					<table style="position: fixed;width:500px;">
						<tbody>
							<tr>
								<td>
									<div class="hp-bar">
										<div id="customHpBar" class="hp-label">0/0</div>
										<div id="customInnerHpBar" class="inner-hp-bar" style="min-width: 100%;max-width: 100%;"></div>
									</div>
								</td>
							</tr>
							<tr style="color: white;">
								<td><img src="images/attack.png" class="img-small"> <span style="padding-right:30px" id="customMonsterAttack">0</span> <img src="images/accuracy.png" class="img-small"> <span style="padding-right:30px;" id="customMonsterAccuracy">0</span> <img src="images/defence.png" class="img-small"> <span id="customMonsterDefence">0</span></td>
							</tr>
						</tbody>
					</table>
					<br><br><br><br><br>
					<div style="display: flex;width: 500px;position: fixed;gap: 10px;">
						<div style="width: 50%;text-align: center;display: flex;align-content: flex-start;flex-wrap: wrap;justify-content: center;">
							<div class="div-enemy-supressed" id="ch-affectedPoison">
								<img class="img-small" src="images/poisonEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ch-affectedIgnoreDefence">
								<img class="img-small" src="images/ignoreDefenceCombatPotionEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ch-affectedReflect">
								<img class="img-small" src="images/reflectSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ch-affectedLifesteal">
								<img class="img-small" src="images/lifeStealSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ch-affectedFreeze">
								<span id="">0</span>
								<img class="img-small" src="images/freezeCombatPotionIcon.png">
							</div>
							<div class="div-enemy-supressed" id="ch-affectedThunderStrike">
								<span id="customThunderStrikeTimer">0</span>
								<img class="img-small" src="images/thunderStrikeSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ch-affectedSandstorm">
								<span id="customSandstormTimer">0</span>
								<img class="img-small" src="images/sandstormSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ch-affectedTeleport">
								<span id="customTeleportTimer">0</span>
								<img class="img-small" src="images/teleportSpellEnemyTimer.png">
							</div>
						</div>
						<div style="width: 50%;text-align: center;display: flex;align-content: flex-start;flex-wrap: wrap;justify-content: center;">
							<div class="div-enemy-supressed" id="ce-affectedPoison">
								<img class="img-small" src="images/poisonEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ce-affectedIgnoreDefence">
								<img class="img-small" src="images/ignoreDefenceCombatPotionEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ce-affectedReflect">
								<img class="img-small" src="images/reflectSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ce-affectedLifesteal">
								<img class="img-small" src="images/lifeStealSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ce-affectedFreeze">
								<span id="">0</span>
								<img class="img-small" src="images/freezeCombatPotionIcon.png">
							</div>
							<div class="div-enemy-supressed" id="ce-affectedThunderStrike">
								<span id="customThunderStrikeTimer">0</span>
								<img class="img-small" src="images/thunderStrikeSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ce-affectedSandstorm">
								<span id="customSandstormTimer">0</span>
								<img class="img-small" src="images/sandstormSpellEnemyTimer.png">
							</div>
							<div class="div-enemy-supressed" id="ce-affectedTeleport">
								<span id="customTeleportTimer">0</span>
								<img class="img-small" src="images/teleportSpellEnemyTimer.png">
							</div>
						</div>
					</div>
					<br><br><br>
					<table>
						<tbody>
							<tr>
								<td style="text-align:center;width: 250px;">
									<div style="display:inline-block;" id="customHeroContainer">
										<span id="customHeroHitsplat"></span>
										<img src="images/none.png" id="customHeroOverlay" style="width: 200px;z-index: 10;position: absolute;display: none;">
										<img src="images/superPoisonTridentMaleWield.png" id="customExplorerWeapon" style="width:200px;z-index:5;position:absolute;">
										<img src="images/maleExplorer.png" id="customHeroImage" width="200px">
									</div>
								</td>
								<td style="text-align:center">
									<div id="customExtraSpaceMonster" style="height: 0px;"></div>
									<div id="customFightCooldown" style="font-size: 20pt; color: yellow; text-align: center; position: fixed; z-index: 200;"><b>Fight in: </b><span id="customStartsIn">5</span></div>
									<div style="display:inline-block" id="customMonsterContainer">
										<img src="images/none.png" id="customMonsterOverlay" style="width: 200px; z-index: 5; position: absolute; display: none;">
										<span id="customMonsterHitsplat"></span>
										<img src="images/bloodFireHawkMonster.png" id="customMonsterImage" style="filter: grayscale(0%);display: inline;width: 250px;opacity: 0.5;">  
									</div>
								</td>
							</tr>
						</tbody>
					</table>
					<table>
						<tbody>
							<tr id="customHeroReductions"></tr>
						</tbody>
					</table>
					<table width="100%">
						<tbody>
							<tr>
								<td colspan="2">
									<div class="hp-bar" style="width:90%">
										<div id="customHeroHpBar" class="hp-label">80/80</div>
										<div id="customHeroInnerHpBar" class="inner-hp-bar" style="min-width: 100%; max-width: 100%;"></div>
									</div>
								</td>
							</tr>
							<tr>
								<td style="border-bottom:1px solid silver" colspan="2">
									<center>
										<table style="margin-bottom:10px;text-align:center;">
											<tbody>
												<tr>
													<td><img id="customHpCombatPotion" onclick="IdleFight.potion('heal')" class="img-small potion-in-combat-td not-draggable" src="images/hpCombatPotionIcon.png"></td>
													<td><img id="customFreezeCombatPotion" onclick="IdleFight.potion('freeze')" class="img-small potion-in-combat-td not-draggable" src="images/freezeCombatPotionIcon.png" style=""></td>
													<td><img id="customIgnoreDefenceCombatPotion" onclick="IdleFight.potion('ignoreDefence')" class="img-small potion-in-combat-td not-draggable" src="images/ignoreDefenceCombatPotionIcon.png" style=""></td>
													<td><img id="customGhostScanCombatPotion" onclick="IdleFight.potion('ghostScan')" class="img-small potion-in-combat-td not-draggable" src="images/ghostScanCombatPotionIcon.png" style=""></td>
													<td><img id="customSuperHpCombatPotion" onclick="IdleFight.potion('superHp')" class="img-small potion-in-combat-td not-draggable" src="images/superHpCombatPotionIcon.png"></td>
													<td><img id="customStrengthCombatPotion" onclick="IdleFight.potion('strength')" class="img-small potion-in-combat-td not-draggable" src="images/strengthCombatPotionIcon.png" style=""></td>
												</tr>
												<tr>
													<td style="cursor:pointer;" onclick="IdleFight.spell('fire')">
														<div id="custom-fireSpellCd" style="font-size: 22pt; display: none;" class="spells-in-combat-cd not-draggable">0</div>
														<img id="custom-fireSpell" style="border: 1px solid cyan; opacity: 1;" class="img-small spells-in-combat-td not-draggable" src="images/fireSpell.png">
													</td>
													<td style="cursor:pointer;" onclick="IdleFight.spell('reflect')">
														<div id="custom-reflectSpellCd" style="font-size: 22pt; display: none;" class="spells-in-combat-cd not-draggable">0</div>
														<img id="custom-reflectSpell" style="border: 1px solid cyan; opacity: 1;" class="img-small spells-in-combat-td not-draggable" src="images/reflectSpell.png">
													</td>
													<td style="cursor:pointer;" onclick="IdleFight.spell('reflect')">
														<div id="custom-teleportSpellCd" style="font-size: 16pt;margin-top: 10px;display: none;" class="spells-in-combat-cd not-draggable">0</div>
														<img id="custom-teleportSpell" style="border: 1px solid cyan;" class="img-small spells-in-combat-td not-draggable" src="images/teleportSpell.png">
													</td>
													<td style="cursor:pointer;" onclick="IdleFight.spell('thunderStrike')">
														<div id="custom-thunderStrikeSpellCd" style="font-size: 22pt; display: none;" class="spells-in-combat-cd not-draggable">0</div>
														<img id="custom-thunderStrikeSpell" style="border: 1px solid cyan; opacity: 1;" class="img-small spells-in-combat-td not-draggable" src="images/thunderStrikeSpell.png">
													</td>
													<td style="cursor:pointer;" onclick="IdleFight.spell('lifeSteal')">
														<div id="custom-lifeStealSpellCd" style="display:none;" class="spells-in-combat-cd not-draggable">0</div>
														<img id="custom-lifeStealSpell" style="border: 1px solid cyan; opacity: 1;" class="img-small spells-in-combat-td not-draggable" src="images/lifeStealSpell.png">
													</td>
													<td style="cursor:pointer;" onclick="IdleFight.spell('sandstorm')">
														<div id="custom-sandstormSpellCd" style="display:none;" class="spells-in-combat-cd not-draggable">0</div>
														<img id="custom-sandstormSpell" style="border: 1px solid cyan; opacity: 1;" class="img-small spells-in-combat-td not-draggable" src="images/sandstormSpell.png">
													</td>
												</tr>
											</tbody>
										</table>
									</center>
								</td>
							</tr>
							<tr style="background-color:black;">
								<td>
									<table width="90%">
										<tbody>
											<tr>
												<td style="color:white;" width="80%">
													<center><img src="images/attack.png" class="img-small"> <span style="padding-right:10px;" id="customHeroAttack">0</span> <img src="images/accuracy.png" class="img-small"> <span style="padding-right:10px;" id="customHeroAccuracy">0</span> <img src="images/defence.png" class="img-small"> <span id="customHeroDefence">0</span> </center>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table style="background-color: black; border-top: 1px solid grey;" width="99%">
						<tbody>
							<tr>
								<td style="text-align:center">
									<div id="customPresetButton-1" onclick="sendBytes(&quot;LOAD_PRESETS=1&quot;)" class="preset-button" style="background-color: rgb(179, 36, 0); border: 3px solid lime;"><img src="images/swordIcon.png" class="img-small"></div>
								</td>
								<td style="text-align:center">
									<div id="customPresetButton-2" onclick="sendBytes(&quot;LOAD_PRESETS=2&quot;)" class="preset-button" style="background-color:#00b300;border:1px solid #008000"><img src="images/bow.png" class="img-small"></div>
								</td>
								<td style="text-align:center">
									<div id="customPresetButton-3" onclick="sendBytes(&quot;LOAD_PRESETS=3&quot;)" class="preset-button" style="background-color:#808000;border:1px solid #4d4d00"><img src="images/bearFurBody.png" class="img-small"></div>
								</td>
								<td style="text-align:center">
									<div id="customPresetButton-4" onclick="sendBytes(&quot;LOAD_PRESETS=4&quot;)" class="preset-button" style="background-color:#007fcf;border:1px solid #00548a"><img src="images/staff.png" class="img-small"></div>
								</td>
								<td style="text-align:center">
									<div id="customPresetButton-5" onclick="sendBytes(&quot;LOAD_PRESETS=5&quot;)" class="preset-button" style="background-color:#ffccff;border:1px solid #b300b3"><img src="images/heartIcon.png" class="img-small"></div>
								</td>
								<td style="text-align:center">
									<div id="customPresetButton-6" onclick="sendBytes(&quot;LOAD_PRESETS=6&quot;)" class="preset-button" style="background-color:#cc6600;border:1px solid #804000"><img src="images/freezeCombatPotionIcon.png" class="img-small"></div>
								</td>
							</tr>
						</tbody>
					</table>
				</center>
			</div>`
			document.querySelector('.game-screen').insertAdjacentHTML('afterbegin', customCombatTab);

			const combatNot = `<div onclick="navigate('customCombat')" style="cursor: pointer;display: none;" id="customCombatNotification" class="notification2"><img src="images/combat.png" class="img-small"> In Combat</div>`
			document.getElementById('notification-combatNotification').insertAdjacentHTML('afterend', combatNot);
		},

		// :]
		showCustomEnemy(enemy) {
			document.getElementById("customMonsterHidden").value = enemy.name;
			document.getElementById("fightCustomModalImage").value = enemy.image;
			document.getElementById("fightCustomModalHp").value = enemy.hp;
			document.getElementById("fightCustomModalAttack").value = enemy.attack;
			document.getElementById("fightCustomModalAccuracy").value = enemy.accuracy;
			document.getElementById("fightCustomModalDefence").value = enemy.defence;
			document.getElementById("fightCustomModalDescription").value = enemy.description;
			document.getElementById("fightCustomModal").showModal();
		},
		
		//Refresh the presets on the custom combat :]
		refreshPresetIcons()  {
			for(let i = 1; i < 7 ; i++)	{
				document.querySelector("#customPresetButton-" + i + " img").src = "images/" + window["preset" + i + "Icon"] + ".png"
				document.querySelector("#customPresetButton-" + i).style.backgroundColor = window["preset" + i + "Color"]
			}
		},
		
		//Cooldown function :]
		spellCooldown(spellName,time) {
			IdleFight.fightStats.hero.spells[spellName] = time;
			if (time > 0) {
				document.getElementById("custom-" + spellName + "SpellCd").innerText = time;
				document.getElementById("custom-" + spellName + "Spell").style.opacity = "0.2";
				setTimeout(function(){
					IdleFight.spellCooldown(spellName,time-1);
				},1000)
			} else {
				document.getElementById("custom-" + spellName + "SpellCd").style.display = "none";
				document.getElementById("custom-" + spellName + "Spell").style.opacity = "1";
			};
		},

		//Cooldown function :]
		cooldown(variable,time,id) {
			IdleFight.fightStats.cooldowns[variable] = time;
			if (id) {
				document.getElementById(id).innerText = time;
			}
			if (time > 0) {
				setTimeout(function(){
					IdleFight.spellCooldown(variable,time-1);
				},1000)
			}
		},
		
		//Cooldown function
		cooldownAbility(index,time) {
			if (IdleFight.fight == false) {IdleFight.fightStats.enemy.abilities = null};
			if (IdleFight.fightStats.enemy.abilities[index] == undefined) {return};
			IdleFight.fightStats.enemy.abilities[index].cooldown = time;
			if (time > 0) {
				setTimeout(function(){
					IdleFight.cooldownAbility(index,time-1);
				},1000)
			}
		},
		
		//Spell Casting Function
		spell(spellName) {
			if (IdleFight.fightStats.hero.spells[spellName] > 0) {
				return;
			};
			if (IdleFight.fightStats.enemy.magicImunity && spellName !== "teleport") {
				IdleFight.addHitSplat('IMMUNE', 'images/fire_icon.png', 'white', 'rgba(255,0,0,0.4)', 'blue', 'Enemy');
				return;
			};
			switch (spellName) {
				case "fire":
					const baseDamage = fireSpellUpgraded == 1 ? 6 : 3;
					let fireDamage = Math.floor(Math.random() * baseDamage);
					if (hasFullDarkRobes()) {
						fireDamage *= 2;
					};
					if (hasFullBloodReaperRobes()) {
						fireDamage *= 3;
					};
					if (IdleFight.fightStats.enemy.weakToFire) {
						fireDamage *= 2
					};
					if (weapon === "staff") {
						fireDamage += 3;
					}
					IdleFight.fightStats.enemy.hp -= fireDamage;
					IdleFight.updateStatsBars();
					IdleFight.addHitSplat(fireDamage, 'images/fire_icon.png', 'white', 'rgba(255,0,0,0.4)', 'blue', 'Enemy');
					IdleFight.spellCooldown('fire',15);
				break;
				case "reflect":
					if (IdleFight.fightStats.hero.isReflecting == false) {
						IdleFight.fightStats.hero.isReflecting = true;
						IdleFight.cooldown('reflect',30);
					}
				break;
				case "teleport":
					//wip
					break;
				case "thunderStrike":
					let thunderDamage = Math.floor(Math.random() * (15 - 10) + 10);
					if (hasFullDarkRobes()) {
						thunderDamage *= 2;
					};
					if (hasFullBloodReaperRobes()) {
						thunderDamage *= 3;
					};
					if (IdleFight.fightStats.enemy.fish) {
						thunderDamage *= 2
					};
					if (weapon === "staff") {
						thunderDamage += 3;
					};

					IdleFight.fightStats.enemy.hp -= thunderDamage;
					IdleFight.updateStatsBars();
					IdleFight.addHitSplat(thunderDamage, 'images/fire_icon.png', 'white', 'rgba(255,0,0,0.4)', 'blue', 'Enemy');
					IdleFight.spellCooldown('thunderStrike',60);
					break;
				case "lifeSteal":
					break;
				case "sandstorm":
					break;
			};
		},

		potion(potionName) {
			if (IdleFight.fightStats.hero.potions[potionName] === false) {
				return;
			};
			switch (potionName) {
				case "heal":
					break;
				case "freeze":
					break;
				case "ignoreDefence":
					break;
				case "ghostScan":
					break;
				case "superHeal":
					break;
				case "strength":
					break;
			}
		},
		
		poison(receiver,poisonDamage) {
			IdleFight.fightStats[receiver].hp -= poisonDamage;
			IdleFight.addHitSplat(poisonDamage, 'images/poison.png', 'green', 'rgba(255,0,0,0.4)', 'blue', receiver);
			IdleFight.updateStatsBars();
			if (IdleFight.fightStats.hero.hp > 0 && IdleFight.fightStats.enemy.hp > 0) {setTimeout(function(){IdleFight.poison(receiver,poisonDamage)},4000)};
		},
		
		//Enemy Special Attack :]
		specialAttack() {
			if (IdleFight.fightStats.enemy.abilities !== null) {
				IdleFight.fightStats.enemy.abilities.forEach((ability,index) => {
					if (ability.cooldown > 0 || ability.limit == 0) {
						return;
					};
					const randomChance = Math.random();
					if (ability.chance > randomChance)  {
						switch (ability.type) {
							case 'heal':
								let healAmount = Math.floor(Math.random() * ((ability.max || 0) - (ability.min || 0) + 1) + (ability.min || 0));
								IdleFight.fightStats.enemy.hp += healAmount;
								IdleFight.fightStats.enemy.hp = Math.min(IdleFight.fightStats.enemy.hp,IdleFight.fightStats.enemy.maxHp);
								IdleFight.updateStatsBars();
								IdleFight.addHitSplat(healAmount, 'images/heal_spell.png', 'lime', 'rgba(0,255,0,0.4)', 'blue', 'Enemy');
							break;
							case 'poison':
								if (IdleFight.fightStats.hero.poisoned) {return}
								IdleFight.fightStats.hero.poisoned = true;
								const poisonDamage = ability.damage || 5
								IdleFight.poison('hero', poisonDamage)
							break;
							case 'damage':
								if (IdleFight.heroIsInvisible > 0) {
									IdleFight.addHitSplat("MISSED","images/ghost_icon.png","white","rgba(255,0,0,0.6)","blue","Hero");
								} else {
									let damageDone = Math.floor(Math.random() * ((ability.max || 0) - (ability.min || 0) + 1) + (ability.min || 0));
									if (IdleFight.fightStats.hero.isReflecting && damageDone > 0) {
										IdleFight.fightStats.enemy.hp -= damageDone;
										IdleFight.fightStats.hero.isReflecting = false;
										IdleFight.addHitSplat(damageDone, "images/reflect_spell.png", 'white', 'rgba(255,0,0,0.6)', 'blue', 'Enemy');
									} else {
										IdleFight.fightStats.hero.hp -= damageDone;
										IdleFight.addHitSplat(damageDone,"images/sword_icon.png","white","rgba(255,0,0,0.6)","blue","Hero");
									}
									IdleFight.updateStatsBars();
								}
							break;
							case 'chargeDamage':
								if (IdleFight.fightStats.cooldowns.enemyIsCharging > 0) {return};
								const charge = ability.charge || 4
								IdleFight.cooldown('enemyIsCharging', charge);
								setTimeout(function() {
									let damageDone = Math.floor(Math.random() * ((ability.max || 0) - (ability.min || 0) + 1) + (ability.min || 0));
									if (IdleFight.fightStats.hero.isReflecting && damageDone > 0) {
										IdleFight.fightStats.enemy.hp -= damageDone;
										IdleFight.fightStats.hero.isReflecting = false;
										IdleFight.addHitSplat(damageDone, "images/reflect_spell.png", 'white', 'rgba(255,0,0,0.6)', 'blue', 'Enemy');
									} else {
										IdleFight.fightStats.hero.hp -= damageDone;
										IdleFight.addHitSplat(damageDone,"images/sword_icon.png","white","rgba(255,0,0,0.6)","blue","Hero");
									}
									IdleFight.updateStatsBars();
								},charge);
							break;
							case 'lifeSteal':
								let damageDone = Math.floor(Math.random() * ((ability.max || 0) - (ability.min || 0) + 1) + (ability.min || 0));
								if (IdleFight.fightStats.hero.isReflecting && damageDone > 0) {
									IdleFight.fightStats.enemy.hp -= damageDone;
									IdleFight.fightStats.hero.isReflecting = false;
									IdleFight.addHitSplat(damageDone, "images/reflect_spell.png", 'white', 'rgba(255,0,0,0.6)', 'blue', 'Enemy');
								} else {
									IdleFight.fightStats.hero.hp -= damageDone;
									IdleFight.fightStats.enemy.hp += damageDone;
									IdleFight.fightStats.enemy.hp = Math.min(IdleFight.fightStats.enemy.hp, IdleFight.fightStats.enemy.maxHp);
									IdleFight.addHitSplat(damageDone,"images/sword_icon.png","white","rgba(255,0,0,0.6)","blue","Hero");
									IdleFight.addHitSplat(damageDone, 'images/heal_spell.png', 'lime', 'rgba(0,255,0,0.4)', 'blue', 'Enemy');
								}
								IdleFight.updateStatsBars();
							break;
							case 'kamikaze':
								IdleFight.fightStats.hero.hp = 0;
								IdleFight.endFight();
							break;
							case "invisibility":
								if (IdleFight.fightStats.cooldowns.enemyIsInvisible > 0) {return}
								let invisibleTime = Math.floor(Math.random() * ((ability.max || 0) - (ability.min || 0) + 1) + (ability.min || 0));
								IdleFight.cooldown('enemyIsInvisible', invisibleTime);
							break;
							case "reflect":
								if (IdleFight.fightStats.enemy.isReflecting) {return};
								IdleFight.fightStats.enemy.isReflecting = true;
							break;
							case "fullRestorePlayer":
								IdleFight.fightStats.hero.hp = maxHp; //Set the current hero hp to max
								IdleFight.updateStatsBars();
							break;
							case "restorePlayerHP":
								let healAmounts = Math.floor(Math.random() * ((ability.max || 0) - (ability.min || 0) + 1) + (ability.min || 0));
								IdleFight.fightStats.hero.hp += healAmounts;
								IdleFight.fightStats.hero.hp = Math.min(IdleFight.fightStats.hero.hp, maxHp);
								IdleFight.updateStatsBars();
								IdleFight.addHitSplat(healAmounts, 'images/heal_spell.png', 'lime', 'rgba(0,255,0,0.4)', 'blue', 'Hero');
							break;
							default:
								ability.limit = 0;
								return;
						};
						if (ability.limit !== -1) {
							ability.limit--;
						};
						if (ability.cooldown > 0) {
							IdleFight.cooldownAbility(index,ability.cooldown)
						};
					};
				});
			}
		},
	
		//Update the stats bar on combat scene :]
		updateStatsBars() {
			//Hero
			document.getElementById("customHpBar").innerHTML = Math.max(0,IdleFight.fightStats.hero.hp) + "/" + heroMaxHp; //Set the number on the hero hp bar
			let heroHpPercentage = IdleFight.fightStats.hero.hp / heroMaxHp * 100;
			document.getElementById("customInnerHpBar").style.minWidth = heroHpPercentage.toFixed() + "%"; // Set the hero hp bar background
			
			//Enemy
			document.getElementById("customHeroHpBar").innerHTML = Math.max(0,IdleFight.fightStats.enemy.hp) + "/" + IdleFight.fightStats.enemy.maxHp; //Set the number on the enemy hp bar
			let EnemyHpPercentage = IdleFight.fightStats.enemy.hp / IdleFight.fightStats.enemy.maxHp * 100;
			document.getElementById("customHeroInnerHpBar").style.minWidth = EnemyHpPercentage.toFixed() + "%"; // Set the enemy hp bar background
		},
		
		//Update the enemy stats mid fight
		updateEnemyStats(foe) {
			IdleFight.setEnemyImage(foe.image);
			IdleFight.fightStats.enemy.abilities = [];
			for (const key in foe) {
				IdleFight.enemy[key] = foe[key];
			};
			IdleFight.updateStatsBars();
			IdleFight.fightStats.enemy.abilities.forEach(function(ability,index) {if (ability.cd > 0){IdleFight.cooldownAbility(index,ability.cd)}});
			document.getElementById("custom-fighting-monster-label").innerText = IdleFight.fightStats.enemy.name;
			document.getElementById("custom_combat_monster_accuracy").innerText = IdleFight.fightStats.enemy.accuracy == -1 ? 1 : IdleFight.fightStats.enemy.accuracy;
			document.getElementById("custom_combat_monster_attack").innerText = IdleFight.fightStats.enemy.damage;
			document.getElementById("custom_combat_monster_speed").innerText = IdleFight.fightStats.enemy.speed;
			document.getElementById("custom_combat_monster_defence").innerText = IdleFight.fightStats.enemy.defence;
		},
		
		//Define the enemy image
		setEnemyImage(image) {
			try {
				IdleFight.fightStats.enemyImage.src = image;
			} catch (error) {
				setTimeout(function() {
					IdleFight.fightStats.enemyImage.src = image;
				}, 1000);
			}
		},
		
		//Starts the fight
		startFight(foe) {
			if (IdleFight.fightStats.fighting) {
				return;
			}
			//Stats Update
			IdleFight.fightStats.hero.hp = heroMaxHp; //Set the current hero hp to max
			IdleFight.setEnemyImage(foe.image); //Set the enemy image
			if (foe.hp > foe.maxHp) {foe.hp = foe.maxHp}; // Enemy can't have more than max hp
			for (const key in foe) {IdleFight.fightStats.enemy[key] = foe[key]}; //Set the current enemy
			
			//UI Update
			IdleFight.refreshPresetIcons(); //Load the preset icon and color
			IdleFight.updateStatsBars(); //Updates all stats on UI
			//Hero Stats
			document.getElementById("customHeroImage").src = "images/" + heroGender + "Explorer.png"
			//document.getElementById("customExplorerWeapon").src = "images/" + superPoisonTrident + heroGender + "Wield.png";
			document.getElementById("customHeroAttack").innerText = attack;
			document.getElementById("customHeroAccuracy").innerText = accuracy;
			document.getElementById("customHeroDefence").innerText = defence;
			//Enemy Stats
			document.getElementById("customMonsterAccuracy").innerText = IdleFight.fightStats.enemy.accuracy == -1 ? 1 : IdleFight.fightStats.enemy.accuracy;
			document.getElementById("customMonsterAttack").innerText = IdleFight.fightStats.enemy.damage;
			document.getElementById("customMonsterDefence").innerText = IdleFight.fightStats.enemy.defence;
			
			navigate('customCombat'); //Go to the fight scene
			document.getElementById('customCombatNotification').style.display = "" //Shows the combat notification
			IdleFight.fightStats.fighting = true; //Starts the fight

			IdleFight.cooldown('startsIn',6,'customStartsIn'); //Start the timer to fight
			document.getElementById("customStartsIn").style.display = "";
			setTimeout(()=>{document.getElementById("customStartsIn").style.display = "none"},5000);
			IdleFight.fightStats.enemy.abilities.forEach((ability,index) => {
				//Make sure all parameters exist
				if (ability.type == undefined) {
					ability.type = null;
				}
				if (ability.startingCooldown == undefined) {
					ability.startingCooldown = 0;
				}
				if (ability.limit == undefined) {
					ability.limit = -1;
				}
				if (ability.chance == undefined) {
					ability.chance = 1;
				}
				if (ability.cooldown == undefined) {
					ability.cooldown = 3;
				}
				//Min can't be greater than max
				if (ability.min !== undefined && ability.min > ability.max) {
					ability.min = ability.max;
				}
				//Cooldown to first activation
				IdleFight.cooldownAbility(index,ability.startingCooldown + 6)
			});
			IdleFight.fightStats.ticking = setInterval(function() {
				IdleFight.tick()
			}, 1000 / 30);
			setTimeout(function(){
				IdleFight.attack("hero");
				IdleFight.attack("enemy");
			}, 6000);
		},
		
		//Hit function :]
		hitRate(attacker) {
			const accuracy = IdleFight.fightStats[attacker].accuracy;
			const localAccuracy = attacker === "hero" && IdleFight.hero.strengthPotion ? Math.floor(accuracy * 0.25) : accuracy;
			const defence = IdleFight.fightStats[attacker].defence;
			if (accuracy == -1) {return false};
			if (attacker === "hero" && IdleFight.fightStats.enemy.ghost && weapon.includes("cythe")) {return true};
			let hitRandom = Math.random();
			let hitChance = 0;
			if (defence % 2) {
				hitChance = (1 / Math.max(1, (defence - 1) / 2 - localAccuracy + 1) + 1 / Math.max(1, (defence + 2) / 2 - localAccuracy + 1)) / 2;
			} else {
				hitChance = 1 / Math.max(1, defence / 2 - localAccuracy + 1);
			}
			return hitRandom <= hitChance
		},
		
		// :]
		checkWeakness() {
			const enemy = IdleFight.fightStats.enemy;
			if (ranged.includes(weapon)) {
				return (enemy.weakToFire && equipedArrows == 'fireArrows') || (enemy.weakToIce && equipedArrows == 'iceArrows')
			};

			return (enemy.ghost && weapon === 'enchantedScythe') || (enemy.fish && weapon.includes('rident'));
		},

		// :]
		tryPoison() {
			if (weapon.includes('poison') || (ranged.includes(weapon) && equipedArrows.includes("oison"))) {
				let poisonDamage = weapon.includes("superPoison") || (ranged.includes(weapon) && equipedArrows === "superPoisonArrows") ? 4 : 1;
				
				if (exploringResearchLevel >= 8) {
					poisonDamage *= 5;
				}

				IdleFight.fightStats.enemy.poisoned = true;
				IdleFight.poison('enemy', poisonDamage);
			};
		},

		// :]
		attack(attacker, receiver) {
			if (!IdleFight.hitRate(attacker)) {
				IdleFight.addHitSplat("0", "images/blocked.png", 'white', 'rgba(255,0,0,0.6)', 'blue', 'Enemy');
				return;
			};

			if (IdleFight.fightStats.cooldowns.enemyIsInvisible > 0) {
				IdleFight.addHitSplat("MISSED","images/ghost_icon.png","white","rgba(255,0,0,0.6)","blue","Enemy");
				return;
			};
			if (IdleFight.fightStats.enemy.arrowImunity && ranged.includes(weapon)) {
				IdleFight.addHitSplat('IMMUNE', 'images/blocked.png', 'white', 'rgba(255,0,0,0.4)', 'blue', 'Enemy');
				return;
			};

			if (IdleFight.fightStats.enemy.poisoned == false) {
				IdleFight.tryPoison();
			};

			let damageDone = Math.floor(Math.random() * parseInt(attack));
			if (IdleFight.checkWeakness()) {
				damageDone *= 2;
			};
			
			if (IdleFight.fightStats[receiver].isReflecting && damageDone > 0) {
				IdleFight.fightStats[attacker].hp -= damageDone;
				IdleFight.fightStats[receiver].isReflecting = false;
				IdleFight.addHitSplat(damageDone, "images/reflect_spell.png", 'white', 'rgba(255,0,0,0.6)', 'blue', attacker);
			} else {
				IdleFight.fightStats[receiver].hp -= damageDone;
				IdleFight.addHitSplat(damageDone, "images/" + weapon + ".png", 'white', 'rgba(255,0,0,0.6)', 'blue', receiver);
				if (attacker === "hero" && IdleFight.fightStats.enemy.defender) {
					IdleFight.fightStats.hero.hp -= 1;
					IdleFight.addHitSplat(1, "images/" + weapon + ".png", 'white', 'rgba(255,0,0,0.6)', 'blue', "hero");
				};
			};
			IdleFight.updateStatsBars();
		},
		
		//HitSplat Generator
		addHitSplat(label, icon, label_color, background_color, border_color, source) {
			let splatX = source == "Hero" ? 150 : 200
			let splatY = source == 450
			let splat = new HitSplat(label, icon, label_color, background_color, border_color, splatX, 450);
	
			let random_key = rand(1,500000);
			IdleFight['hitSplat']+source[random_key] == splat;
	
			setTimeout(
				function(){
					delete IdleFight['hitSplat']+source[random_key];
				}
			,1000)
		},
		
		//Evething that should be called each second
		tick() {
			//UI
			//Hero Stats
			document.getElementById("customHeroAttack").innerText = attack;
			document.getElementById("customHeroAccuracy").innerText = accuracy;
			document.getElementById("customHeroDefence").innerText = defence;
			IdleFight.tickAffected();
			IdleFight.manageHitplats();
			
			IdleFight.fightStats.ticks++
			if (IdleFight.fightStats.ticks % 30 === 0) {
				if (IdleFight.fightStats.enemy.hp <= 0) {
					if (IdleFight.fightStats.enemy.multiPhase) {
						IdleFight.updateEnemyStats(IdleFight.fightStats.enemy.nextPhase)
					} else {
						IdleFight.endFight();
						return;
					}
				} else if (IdleFight.fightStats.hero.hp <= 0) {
					IdleFight.endFight();
					return;
				};

				if(IdleFight.startsIn <= 0) {
					IdleFight.specialAttack()
				}
			};
			if (IdleFight.fightStats.ticks % 120 === 0) {
				IdleFight.attack("hero","enemy");
				IdleFight.attack("enemy","hero");
			}
		},
		
		//:]
		tickAffected() {
			if (IdleFight.fightStats.hero.isReflecting) {
				document.getElementById("affectedReflectHero").style.display = "";
			};
			if (IdleFight.fightStats.cooldowns.enemyIsInvisible > 0) {
				document.getElementById("customMonsterImage").style.opacity = 0.5;
				document.getElementById("affectedInvisibleMonster").style.display = "";
				document.getElementById("customInvisibleTimerMonster").innerText = IdleFight.fightStats.cooldowns.enemyIsInvisible;
			} else {
				document.getElementById("customMonsterImage").style.opacity = 1;
				document.getElementById("affectedInvisibleMonster").style.display = "none";
			};
			if (IdleFight.fightStats.enemy.isReflecting) {
				document.getElementById("affectedReflectEnemy").style.display = "";
			};
			if (IdleFight.enemyIsCharging > 0) {
				document.getElementById("affectedChargingMonster").style.display = "";
				document.getElementById("customChargingTimerMonster").innerText = IdleFight.fightStats.cooldowns.enemyIsCharging;
			} else {
				document.getElementById("affectedChargingMonster").style.display = "none";
			};
		},
		
		manageHitplats() {
			for (let key in IdleFight.hitSplatHero) {
				IdleFight.hitSplatHero[key].draw(IdleFight.heroContext);
			};
			for (let key in IdleFight.hitSplatEnemy) {
				IdleFight.hitSplatEnemy[key].draw(IdleFight.enemyContext);
			};
		},
		
		looting() {
			let lootedItems = [];
			let lootedItemsHTML = '';
			IdleFight.fightStats.enemy.lootTable.forEach((loot) => {
				let dropChance = Math.random() * (loot.chance - 1) + 1;
				if (loot.chance >= dropChance) {
					let dropAmount = Math.random() * (loot.max - loot.min) + loot.min;
					if (dropAmount == 0) {dropAmount = ''};
					lootedItemsHTML += `<div class="loot" style="background-color:#cce6ff">
						<img src="${loot.image}" class="w50 me-3">${dropAmount} ${loot.item}
					</div>`;
					lootedItems.push({item:loot.item,amount:dropAmount});
				};
			});
			document.getElementById('modal-custom-loot-body').innerHTML = lootedItemsHTML;
			document.getElementById('customCombatModalParent').style.display = "";
			return lootedItems;
		},
		
		endFight() {
			IdleFight.fightStats.fighting = false;
			clearInterval(IdleFight.fightStats.ticking);
			IdleFight.hitSplatHero = {};
			IdleFight.hitSplatEnemy = {};
			
			IdleFight.fightStats.enemy.poisoned = false;
			IdleFight.fightStats.hero.poisoned = false;
			IdleFight.fightStats.hero.strengthPotion = false;
			IdleFight.fightStats.hero.isReflecting = false;
			IdleFight.fightStats.hero.lifeSteal = 0;
			IdleFight.fightStats.hero.potion = {
				heal: true,
				freeze: true,
				accuracy: true,
				ghost: true,
				superHeal: true,
				strength: true
			};
			IdleFight.fightStats.hero.spells = {
				fire: 0,
				reflect: 0,
				teleport: 0,
				thunderStrike: 0,
				lifeSteal: 0,
				sandstorm: 0
			};
			IdleFight.fightStats.cooldowns = {
				startsIn: 0,
				enemyIsInvisible: 0,
				enemyIsCharging: 0
			};

			if (IdleFight.fightStats.enemy.hp <= 0) {
				if (typeof IdleFight.fightStats.enemy.lootTable == 'object') {
					IdleFight.fightStats.enemy.lootFunction(IdleFight.looting());
				};
				if (typeof IdleFight.fightStats.enemy.winFunction == 'function') {
					IdleFight.fightStats.enemy.winFunction();
				};
			} else if (IdleFight.fightStats.hero.hp <= 0) {
				console.log('loser');
			}
			for (const key in defaultEnemy) {
				IdleFight.enemy[key] = defaultEnemy[key];
			};
			navigate('exploring');
			document.getElementById('customCombatNotification').style.display = "none" //Hide the combat notification
		}
	};
	window.IdleFight = IdleFight;
})()