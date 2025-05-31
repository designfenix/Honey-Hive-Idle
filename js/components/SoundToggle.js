// js/components/SoundToggle.js

import { createElement } from "../utils/domHelper.js";

/**
 * Clase para manejar el botón flotante que activa/desactiva la música:
 * - Crea dinámicamente un <button id="music-toggle"> y lo añade al body.
 * - Alterna clases "silence" y reproduce/pausa el Audio pasado por parámetro.
 *
 * @param {THREE.Audio} musicAudio - instancia de THREE.Audio que controla la música de fondo.
 */
export class SoundToggle {
  constructor(musicAudio) {
    this.musicAudio = musicAudio;
    this.musicOn = true;

    // Creamos el botón y lo anexamos al body
    this.musicBtn = createElement("button", { id: "music-toggle" }, document.body);

    // Listener para alternar música
    this.musicBtn.addEventListener("click", () => {
      this.musicOn = !this.musicOn;
      if (this.musicOn) {
        this.musicAudio.play();
        this.musicBtn.classList.remove("silence");
      } else {
        this.musicAudio.pause();
        this.musicBtn.classList.add("silence");
      }
    });
  }
}
