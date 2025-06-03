// js/GameManager.js

import * as THREE from "https://esm.sh/three@0.174.0";
import { ResourceBar } from "./components/ResourceBar.js";
import { UpgradeCard } from "./components/UpgradeCard.js";

/**
 * GameManager se encarga de:
 * - Mantener el estado del juego (bees, wasps, nectar, pollen, niveles).
 * - Proveer métodos para calcular costes y lógica de compra (_calcBeeCost, _buyBee, etc.).
 * - Actualizar la UI a través de ResourceBar y UpgradeCard.
 * - Actualizar producción de recursos en cada frame (productionLoop).
 * - Comunicar con ThreeScene para spawnBee/spawnWasp y movimiento en órbita.
 */
export class GameManager {
  /**
   * @param {ThreeScene} threeScene - instancia de ThreeScene para invocar spawnBee/spawnWasp, etc.
   * @param {ResourceBar} resourceBar - instancia de ResourceBar para refrescar valores.
   * @param {Array<UpgradeCard>} upgradeCards - lista de instancias UpgradeCard (una por cada tarjeta).
   * @param {SoundToggle} soundToggle - instancia de SoundToggle (para reproducir música/SFX).
   */
  constructor(threeScene, resourceBar, upgradeContainer, templates, soundToggle) {
    this.threeScene = threeScene;
    this.resourceBar = resourceBar;
    this.upgradeContainer = upgradeContainer;
    this.cardTemplates = templates;
    this.soundToggle = soundToggle;
    this.upgradeCards = [];
    this.upgradeOrder = ["contratar", "avispa", "produccion", "mejorar-colmena", "pato"];

    // personajes del juego
    this.bees = [];
    this.wasps = [];
    this.ducks = [];
    this.nectar = 0;
    this.pollen = 0;
    // Polén acumulado durante toda la partida (no se reduce al gastar)
    this.pollenLifetime = 0;
    // Cantidad de polen acumulado desde que se alcanzó el nivel actual
    this.levelStartPollen = 0;
    this.prodLevel = 0;
    this.hiveLevel = 0;
    this.userLevel = 1;

    // Parámetros iniciales y ratios (copiados de ColmenaApp.DEFAULTS)
    this.initialFreeBees = 1;
    this.costBaseBee = 20;
    this.costRateBee = 1.15;
    this.baseWaspCost = 100;
    this.waspCostRate = 2;
    this.waspPollenPerSec = 0.5;

    this.baseRates = {
      nectarPerBee: 1,
      pollenRatio: 0.2,
    };

    this.cardLevelReq = {
      contratar: 1,
      avispa: 2,
      produccion: 5,
      'mejorar-colmena': 7,
      pato: 10
    };

    // Configuramos el hiveSpeedMultiplier en ThreeScene
    // Equivalente a: 1 + this.hiveLevel * 0.05
    this.threeScene.setHiveSpeedMultiplier(() => 1 + this.hiveLevel * 0.05);

    // Creamos primeras tarjetas (bee desbloqueada + wasp bloqueada)
    this._createCard("contratar");
    const wasp = this._createCard("avispa");
    wasp.setLocked(true, `Nivel ${this.cardLevelReq["avispa"]}`);
    this._updateCardLocks();

    this._updateCardLocks();

  }

  _createCard(type) {
    const tpl = this.cardTemplates[type];
    if (!tpl) return null;
    const element = tpl.content.firstElementChild.cloneNode(true);
    this.upgradeContainer.appendChild(element);
    const card = new UpgradeCard(element, (upgradeType) => {
      switch (upgradeType) {
        case "contratar":
          this._buyBee();
          break;
        case "avispa":
          this._buyWasp();
          break;
        case "pato":
          this._buyDuck();
          break;
        case "produccion":
          this._buyProd();
          break;
        case "mejorar-colmena":
          this._buyHive();
          break;
        default:
          console.warn(`Upgrade desconocido: ${upgradeType}`);
      }
    });
    this.upgradeCards.push(card);
    return card;
  }

  _createCard(type) {
    const tpl = this.cardTemplates[type];
    if (!tpl) return null;
    const element = tpl.content.firstElementChild.cloneNode(true);
    this.upgradeContainer.appendChild(element);
    const card = new UpgradeCard(element, (upgradeType) => {
      switch (upgradeType) {
        case "contratar":
          this._buyBee();
          break;
        case "avispa":
          this._buyWasp();
          break;
        case "pato":
          this._buyDuck();
          break;
        case "produccion":
          this._buyProd();
          break;
        case "mejorar-colmena":
          this._buyHive();
          break;
        default:
          console.warn(`Upgrade desconocido: ${upgradeType}`);
      }
    });
    this.upgradeCards.push(card);
    return card;
  }

  // -------------------------------------------------
  // Métodos para cálculos de costes (idénticos a ColmenaApp)
  // -------------------------------------------------
  _baseBeeCost() {
    return this.bees.length < this.initialFreeBees ? 0 : this.costBaseBee;
  }

  _calcBeeCost() {
    const n = this.bees.length;
    return Math.ceil(this._baseBeeCost() * Math.pow(this.costRateBee, n));
  }

  _calcWaspCost() {
    const w = this.wasps.length;
    return Math.ceil(this.baseWaspCost * Math.pow(this.waspCostRate, w));
  }

  _calcDuckCost() {
    const d = this.ducks.length;
    return Math.ceil(50 * Math.pow(1.2, d));
  }

  _calcProdCost() {
    return Math.ceil(100 * Math.pow(1.5, this.prodLevel));
  }

  _calcHiveCost() {
    return Math.ceil(1200 * Math.pow(2, this.hiveLevel));
  }

  _nectarPerBee() {
    return this.baseRates.nectarPerBee * (1 + this.prodLevel * 0.1);
  }

  _levelRequirement(level) {
    return Math.floor(3000 * Math.pow(level, 1.7));
  }

  _checkLevelUp() {
    while (this.pollenLifetime - this.levelStartPollen >= this._levelRequirement(this.userLevel)) {
      this.userLevel++;
      this.levelStartPollen = this.pollenLifetime;
      if (this.threeScene.lightCone && typeof this.threeScene.lightCone.triggerAnimation === 'function') {
        this.threeScene.lightCone.triggerAnimation();
      }
      this._updateCardLocks();
    }
  }

  _updateCardLocks() {
    this.upgradeCards.forEach((card) => {
      const req = this.cardLevelReq[card.upgradeType] ?? 1;
      card.setLocked(this.userLevel < req, `Nivel ${req}`);
    });

    // Mostrar siguiente tarjeta si la última está desbloqueada
    const lastCard = this.upgradeCards[this.upgradeCards.length - 1];
    const lastIndex = this.upgradeOrder.indexOf(lastCard.upgradeType);
    if (!lastCard.isLocked && lastIndex < this.upgradeOrder.length - 1) {
      const nextType = this.upgradeOrder[lastIndex + 1];
      if (!this.upgradeCards.find((c) => c.upgradeType === nextType)) {
        const newCard = this._createCard(nextType);
        const req = this.cardLevelReq[nextType] ?? 1;
        newCard.setLocked(this.userLevel < req, `Nivel ${req}`);
      }
    }
  }

  _updateCardLocks() {
    this.upgradeCards.forEach((card) => {
      const req = this.cardLevelReq[card.upgradeType] ?? 1;
      card.setLocked(this.userLevel < req, `Nivel ${req}`);
    });

    // Mostrar siguiente tarjeta si la última está desbloqueada
    const lastCard = this.upgradeCards[this.upgradeCards.length - 1];
    const lastIndex = this.upgradeOrder.indexOf(lastCard.upgradeType);
    if (!lastCard.isLocked && lastIndex < this.upgradeOrder.length - 1) {
      const nextType = this.upgradeOrder[lastIndex + 1];
      if (!this.upgradeCards.find((c) => c.upgradeType === nextType)) {
        const newCard = this._createCard(nextType);
        const req = this.cardLevelReq[nextType] ?? 1;
        newCard.setLocked(this.userLevel < req, `Nivel ${req}`);
      }
    }
  }

  _updateCardLocks() {
    this.upgradeCards.forEach(card => {
      const req = this.cardLevelReq[card.upgradeType] ?? 1;
      card.setLocked(this.userLevel < req);
    });
  }

  // -------------------------------------------------
  // Lógica de compra (cada método actualiza estado, reproduce SFX y llama a updateAll)
  // -------------------------------------------------
  _buyBee() {
    const cost = this._calcBeeCost();
    if (this.pollen < cost) return false;
    this.pollen -= cost;

    // Pedimos a ThreeScene que cree la abeja en 3D
    const beeEntity = this.threeScene.spawnBee();
    this.bees.push(beeEntity);

    this._updateAllUI();
    return true;
  }

  _buyWasp() {
    const cost = this._calcWaspCost();
    if (this.pollen < cost) return false;
    this.pollen -= cost;

    const waspEntity = this.threeScene.spawnWasp();
    this.wasps.push(waspEntity);

    this._updateAllUI();
    return true;
  }

  _buyDuck() {
    const cost = this._calcDuckCost();
    if (this.pollen < cost) return false;
    this.pollen -= cost;

    const duckEntity = this.threeScene.spawnDuck();
    this.ducks.push(duckEntity);

    this._updateAllUI();
    return true;
  }

  _buyProd() {
    // Aquí, para mantener SFX igual al original: se reproduce plop antes
    this.threeScene.plopSound.stop();
    this.threeScene.plopSound.play();

    const cost = this._calcProdCost();
    if (this.nectar < cost) return false;
    this.nectar -= cost;
    this.prodLevel++;
    this._updateAllUI();
    return true;
  }

  _buyHive() {
    this.threeScene.plopSound.stop();
    this.threeScene.plopSound.play();

    const cost = this._calcHiveCost();
    if (this.nectar < cost) return false;
    this.nectar -= cost;
    this.hiveLevel++;

    // Cada colmena nueva aumenta velocidad de órbita de bees/wasps
    this.bees.forEach((bee) => (bee.userData.orbit.speed *= 1.05));
    this.wasps.forEach((wasp) => (wasp.userData.orbit.speed *= 1.05));
    this.ducks.forEach((duck) => (duck.userData.orbit.speed *= 1.05));

    // Actualizamos el callback de hiveSpeedMultiplier (re-sobrescribe con el nuevo level)
    this.threeScene.setHiveSpeedMultiplier(() => 1 + this.hiveLevel * 0.05);

    this._updateAllUI();
    return true;
  }

  // -------------------------------------------------
  // Actualiza UI global (ResourceBar + todas las UpgradeCards)
  // -------------------------------------------------
  _updateAllUI() {
    // 1. Refrescar ResourceBar:
    const speedPercent = (1 + this.hiveLevel * 0.05) * 100;
    const levelReq = this._levelRequirement(this.userLevel);
    const levelProgress = this.pollenLifetime - this.levelStartPollen;
    this.resourceBar.refresh(
      this.pollen,
      this.nectar,
      speedPercent,
      this.userLevel,
      levelReq,
      levelProgress
    );

    // 2. Refrescar cada UpgradeCard con su coste, valor y si se puede pagar:
    //    - abeja:
    const beeCost = this._calcBeeCost();
    const canBuyBee = this.pollen >= beeCost;
    const beeCard = this.upgradeCards.find((c) => c.upgradeType === "contratar");
    if (beeCard) beeCard.refresh(beeCost, this.bees.length, canBuyBee);

    //    - avispa:
    const waspCost = this._calcWaspCost();
    const canBuyWasp = this.pollen >= waspCost;
    const waspCard = this.upgradeCards.find((c) => c.upgradeType === "avispa");
    if (waspCard) waspCard.refresh(waspCost, this.wasps.length, canBuyWasp);

    //    - duck:
    const duckCost = this._calcDuckCost();
    const canBuyDuck = this.pollen >= duckCost;
    const duckCard = this.upgradeCards.find((c) => c.upgradeType === "pato");
    if (duckCard) duckCard.refresh(duckCost, this.ducks.length, canBuyDuck);

    //    - producción:
    const prodCost = this._calcProdCost();
    const canBuyProd = this.nectar >= prodCost;
    const prodCard = this.upgradeCards.find((c) => c.upgradeType === "produccion");
    if (prodCard) prodCard.refresh(prodCost, this.prodLevel * 10, canBuyProd);

    //    - colmena:
    const hiveCost = this._calcHiveCost();
    const canBuyHive = this.nectar >= hiveCost;
    const hiveCard = this.upgradeCards.find(
      (c) => c.upgradeType === "mejorar-colmena"
    );
    if (hiveCard) hiveCard.refresh(hiveCost, this.hiveLevel * 5, canBuyHive);
  }

  // -------------------------------------------------
  // Producción de recursos cada frame (llamado por ThreeScene)
  // -------------------------------------------------
  productionLoop(delta) {
    // 1) Guardamos el valor inicial para calcular polen generado en este ciclo
    const pollenBefore = this.pollen;

    // 2) Polén base por abejas “libres”
    this.pollen += this.bees.length * delta;

    // 3) Néctar y polen derivado (según prodLevel y hive speed)
    const nectarRate =
      this.bees.length *
      this._nectarPerBee() *
      (1 + this.hiveLevel * 0.05);
    this.nectar += nectarRate * delta;
    this.pollen += nectarRate * this.baseRates.pollenRatio * delta;

    // 4) Polén extra por avispas
    this.pollen += this.wasps.length * this.waspPollenPerSec * delta;

    // Cantidad total generada en este ciclo (solo suma si es positiva)
    const produced = this.pollen - pollenBefore;
    if (produced > 0) {
      this.pollenLifetime += produced;
    }

    // 5) Movimiento en órbita (el propio ThreeScene itera internamente bees y wasps)
    const hiveCenter = new THREE.Vector3().setFromMatrixPosition(
      this.threeScene.hive.matrixWorld
    );
    this.bees.forEach((bee) =>
      this.threeScene._moveInOrbit(bee, delta, hiveCenter)
    );
    this.wasps.forEach((wasp) =>
      this.threeScene._moveInOrbit(wasp, delta, hiveCenter)
    );
    this.ducks.forEach((duck, i) => {
      this.threeScene._moveInOrbit(duck, delta, hiveCenter)
    });
    this._checkLevelUp();

    // 6) Finalmente, actualizamos UI para reflejar cambios
    this._updateAllUI();
  }
}
