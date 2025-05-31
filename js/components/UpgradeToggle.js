// js/components/UpgradeToggle.js

export class UpgradeToggle {
  constructor() {
    this.toggleBtn = document.querySelector(".upgrade-toggle");
    this.upgradeBar = document.querySelector(".upgrade-bar");

    // Estado inicial: upgrade-bar está cerrada
    this._isOpen = true;

    // Listener del clic
    this.toggleBtn.addEventListener("click", () => this._toggle());
  }

  /**
   * Alterna la visibilidad de la barra de upgrades:
   * - Si está cerrada, la abre (añade clase 'open' a ambos).
   * - Si está abierta, la cierra (remueve clase 'open').
   */
  _toggle() {
    this._isOpen = !this._isOpen;
    if (this._isOpen) {
      this.upgradeBar.classList.add("open");
      this.toggleBtn.setAttribute("aria-expanded", "true");
      this.toggleBtn.setAttribute("aria-label", "Ocultar mejoras");
      // Cambiar el ícono si quieres, por ejemplo a '⬇️'
      this.toggleBtn.textContent = "⬇️";
    } else {
      this.upgradeBar.classList.remove("open");
      this.toggleBtn.setAttribute("aria-expanded", "false");
      this.toggleBtn.setAttribute("aria-label", "Mostrar mejoras");
      this.toggleBtn.textContent = "⬆️";
    }
  }
}
