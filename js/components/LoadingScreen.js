"// js/components/LoadingScreen.js

import { getElement } from "../utils/domHelper.js";

/**
 * Clase encargada de manejar la UI de la pantalla de carga:
 * - Muestra una barra de progreso.
 * - Actualiza el ancho de la barra y el texto de porcentaje.
 * - Al terminar, hace fade out de todo el contenedor .loading-container.
 */
export class LoadingScreen {
  constructor() {
    // Referencias a elementos del DOM
    this.container = getElement(".loading-container");
    this.barFill = getElement(".loading-bar-fill");
    this.textPercent = getElement("#loading-percent");
  }

  /**
   * Actualiza la barra de progreso.
   * @param {number} loaded - cantidad de archivos cargados
   * @param {number} total - total de archivos a cargar
   * @param {string} url - URL del asset que se está cargando (opcional para debug)
   * @param {number} percent - porcentaje calculado (0–100)
   */
  updateProgress(loaded, total, url, percent) {
    this.barFill.style.width = `${percent}%`;
    this.textPercent.textContent = `${percent}%`;
  }

  /**
   * Oculta la pantalla de carga con una animación.
   * Retorna una promesa que se resuelve cuando el contenedor queda con display: none.
   */
  hide() {
    return new Promise((resolve) => {
      // Usamos GSAP para animar el fade-out
      gsap.to(this.container, {
        opacity: 0,
        duration: 0.8,
        onComplete: () => {
          this.container.style.display = "none";
          resolve();
        },
      });
    });
  }
}
