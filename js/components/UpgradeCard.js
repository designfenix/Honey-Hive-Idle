// js/components/UpgradeCard.js

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

    this.lockOverlay = element.querySelector('.lock-overlay');
    this.isLocked = this.element.classList.contains('locked');

    this.costEl = element.querySelector('[data-cost]');
    this.valueEl = element.querySelector('[data-value]');

    // Listener al botón de compra
    this.element.addEventListener("click", () => {
      if (this.isLocked) return;
      if (typeof this.onClickCallback === "function") {
        this.onClickCallback(this.upgradeType);
      }
    });
  }

  setLocked(locked, text = null) {
    this.isLocked = locked;
    this.element.classList.toggle('locked', locked);
    if (this.lockOverlay) {
      if (text !== null) {
        const textEl = this.lockOverlay.querySelector('.lock-text');
        if (textEl) textEl.textContent = text;
      }
      if (!locked) {
        this.lockOverlay.style.opacity = '';
        this.lockOverlay.style.visibility = '';
      }
    }
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
    if(canAfford){
      this.element.classList.remove('disabled');
    }else{
      this.element.classList.add('disabled');
    }
  }
}
