"// js/components/UpgradeCard.js

import { getElement, createElement } from "../utils/domHelper.js";
import { formatNumber } from "../utils/formatNumber.js";

/**
 * Clase que controla una sola tarjeta de upgrade:
 * - Recibe el nodo .upgrade-card (ya existente en el DOM).
 * - Detecta qué tipo de “upgrade” es: "contratar", "avispa", "produccion", "mejorar-colmena".
 * - Permite pasarle un callback onClick para delegar la lógica de compra a GameManager.
 * - Expone un método `refresh(cost, value, canAfford)` para actualizar coste, contador y estado del botón.
 */
export class UpgradeCard {
  /**
   * @param {Element} element - Nodo .upgrade-card correspondiente a esta tarjeta.
   * @param {Function} onClickCallback - función que se invoca al hacer click en “Comprar”.
   *        Se le pasará el data-upgrade para que GameManager sepa cuál.
   */
  constructor(element, onClickCallback) {
    this.element = element;
    this.upgradeType = element.dataset.upgrade; // "contratar", "avispa", "produccion" o "mejorar-colmena"
    this.onClickCallback = onClickCallback;

    // Buscamos internamente el <button> y el <span> de coste y valor (si existe)
    this.button = element.querySelector(".btn-purchase");
    this.costEl = element.querySelector(".cost span:not(.icon)"); // el <span> que contiene el número
    this.valueEl = element.querySelector(".count span"); // solo existe en abeja/avispa

    // Listener al botón de compra
    this.button.addEventListener("click", () => {
      if (typeof this.onClickCallback === "function") {
        this.onClickCallback(this.upgradeType);
      }
    });
  }

  /**
   * Actualiza la UI de esta tarjeta:
   * - cost: número a mostrar como coste (por ejemplo “41”).
   * - value: cantidad (solo para abeja/avispa). Si es tipo "produccion" o "mejorar-colmena", 
   *          puedes pasar null o dejar este parámetro vacío (no mostrará nada).
   * - canAfford: boolean → si false, deshabilita el botón; si true, lo habilita.
   *
   * @param {number} cost
   * @param {number|null} value
   * @param {boolean} canAfford
   */
  refresh(cost, value = null, canAfford = true) {
    // Actualizamos coste
    this.costEl.textContent = formatNumber(cost);

    // Actualizamos valor (si existe)
    if (this.valueEl) {
      this.valueEl.textContent = value !== null ? formatNumber(value) : "0";
    }

    // Habilitamos/deshabilitamos el botón
    this.button.disabled = !canAfford;
  }
}
