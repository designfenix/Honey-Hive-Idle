// js/components/ResourceBar.js

import { getElement } from "../utils/domHelper.js";
import { formatNumber } from "../utils/formatNumber.js";

/**
 * Clase que actualiza la sección superior de recursos:
 * - Cantidad de abejas (“bee-value”).
 * - Cantidad de avispas (“wasp-value”).
 * - Polén (“pollen-value”).
 * - Néctar (“nectar-value”).
 * - Velocidad de la colmena (“speed-value”).
 *
 * Se instancia pasándole las referencias a los elementos del DOM,
 * luego se llama a `refresh(beesCount, waspsCount, pollen, nectar, speedPercent, userLevel, levelRequirement, levelPollen)`.
 */
export class ResourceBar {
  constructor() {
    this.beeEl = getElement("#bee-value");
    this.waspEl = getElement("#wasp-value");
    this.duckEl = getElement("#duck-value");
    this.pollenEl = getElement("#pollen-value");
    this.nectarEl = getElement("#nectar-value");
    this.speedEl = getElement("#speed-value");
    this.levelEl = getElement("#user-level");
    this.levelFillEl = getElement("#level-bar-fill");
    this.levelProgressTextEl = getElement("#level-progress-text");
  }

  /**
   * Actualiza todos los valores en la UI.
   * @param {number} beesCount
   * @param {number} waspsCount
   * @param {number} pollen
   * @param {number} nectar
   * @param {number} speedPercent - ya en porcentaje (por ejemplo 120 para “120%”) sin el símbolo
   * @param {number} userLevel - nivel actual del usuario
   * @param {number} levelRequirement - polen total necesario para el siguiente nivel
   * @param {number} levelPollen - polen acumulado desde que se alcanzó el nivel actual
   */
  refresh(
    beesCount,
    waspsCount,
    ducksCount,
    pollen,
    nectar,
    speedPercent,
    userLevel,
    levelRequirement,
    levelPollen
  ) {
    this.beeEl.textContent = formatNumber(beesCount);
    this.waspEl.textContent = formatNumber(waspsCount);
    this.duckEl.textContent = formatNumber(ducksCount);
    this.pollenEl.textContent = formatNumber(Math.floor(pollen));
    this.nectarEl.textContent = formatNumber(Math.floor(nectar));
    this.speedEl.textContent = formatNumber(Math.round(speedPercent));
    if (
      userLevel !== undefined &&
      levelRequirement !== undefined &&
      levelPollen !== undefined
    ) {
      this.levelEl.textContent = userLevel;
      const progress = Math.min(levelPollen / levelRequirement, 1);
      this.levelFillEl.style.width = `${progress * 100}%`;
      this.levelProgressTextEl.textContent = `${formatNumber(
        Math.floor(levelPollen)
      )} / ${formatNumber(levelRequirement)}`;
    }
  }
}
