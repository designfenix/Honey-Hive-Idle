"// js/components/IntroScreen.js

import { getElement } from "../utils/domHelper.js";

/**
 * Clase que controla la pantalla de introducción:
 * - Muestra el logo y el botón “JUGAR” una vez que los assets cargaron.
 * - Permite registrar un callback para cuando el usuario da click a “JUGAR”.
 * - Provee un método para animar la salida de esta intro (fade-out).
 */
export class IntroScreen {
  constructor(onPlayCallback) {
    this.container = getElement(".intro-screen");
    this.playButton = getElement("#btn-play");
    this.onPlayCallback = onPlayCallback;

    // Al hacer click en “JUGAR”, llamamos al callback
    this.playButton.addEventListener("click", () => {
      if (typeof this.onPlayCallback === "function") {
        this.onPlayCallback();
      }
    });
  }

  /**
   * Anima la desaparición del intro (fade out) y luego lo oculta completamente.
   * Retorna una promesa que se resuelve cuando se oculta.
   * Opcional: podrías devolver el promise al controlador de App para coordinar más pasos.
   */
  hide() {
    return new Promise((resolve) => {
      gsap.to(this.container, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          this.container.style.display = "none";
          resolve();
        },
      });
    });
  }

  /**
   * Muestra la intro con animaciones de aparición (fade-in + slide).
   * Reproduce la lógica original de aparición: logo aparece con retraso, luego el botón.
   */
  show() {
    this.container.style.display = "flex";
    // Primero hacemos que el logo aparezca
    gsap.fromTo(
      this.container.querySelector("img"),
      { opacity: 0, y: 100, scale: 0.5 },
      { opacity: 1, scale: 1, y: 0, duration: 2, delay: 1 }
    );
    // Luego hacemos que el botón aparezca
    gsap.fromTo(
      this.playButton,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 1, delay: 2 }
    );
  }
}
