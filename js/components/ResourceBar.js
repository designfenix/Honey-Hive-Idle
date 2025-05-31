"// js/components/ResourceBar.js

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
 * luego se llama a `refresh(beesCount, waspsCount, pollen, nectar, speedPercent)`.
 */
export class ResourceBar {
  constructor() {
    this.beeEl = getElement("#bee-value");
    this.waspEl = getElement("#wasp-value");
    this.pollenEl = getElement("#pollen-value");
    this.nectarEl = getElement("#nectar-value");
    this.speedEl = getElement("#speed-value");
  }

  /**
   * Actualiza todos los valores en la UI.
   * @param {number} beesCount
   * @param {number} waspsCount
   * @param {number} pollen
   * @param {number} nectar
   * @param {number} speedPercent - ya en porcentaje (por ejemplo 120 para “120%”) sin el símbolo
   */
  refresh(beesCount, waspsCount, pollen, nectar, speedPercent) {
    this.beeEl.textContent = formatNumber(beesCount);
    this.waspEl.textContent = formatNumber(waspsCount);
    this.pollenEl.textContent = formatNumber(Math.floor(pollen));
    this.nectarEl.textContent = formatNumber(Math.floor(nectar));
    this.speedEl.textContent = formatNumber(Math.round(speedPercent)) + "%";
  }
}
