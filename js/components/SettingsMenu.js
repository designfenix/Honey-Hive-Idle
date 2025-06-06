// js/components/SettingsMenu.js
import { getElement } from "../utils/domHelper.js";

export class SettingsMenu {
  constructor(threeScene) {
    this.threeScene = threeScene;

    this.menuEl = getElement(".settings-menu");
    this.openBtn = getElement("#settings-button");
    this.closeBtn = getElement("#settings-close");
    this.musicInput = getElement("#music-volume");
    this.sfxInput = getElement("#sfx-volume");
    this.qualitySelect = getElement("#render-quality");

    const saved = JSON.parse(localStorage.getItem("honeyHiveConfig") || "{}");
    if (saved.musicVolume !== undefined) this.musicInput.value = saved.musicVolume;
    if (saved.sfxVolume !== undefined) this.sfxInput.value = saved.sfxVolume;
    if (saved.quality) this.qualitySelect.value = saved.quality;

    this.applySettings();

    this.openBtn.addEventListener("click", () => this.menuEl.classList.add("open"));
    this.closeBtn.addEventListener("click", () => this.menuEl.classList.remove("open"));

    this.musicInput.addEventListener("input", () => {
      this.threeScene.setMusicVolume(parseFloat(this.musicInput.value));
      this._save();
    });
    this.sfxInput.addEventListener("input", () => {
      this.threeScene.setSFXVolume(parseFloat(this.sfxInput.value));
      this._save();
    });
    this.qualitySelect.addEventListener("change", () => {
      this.threeScene.setQuality(this.qualitySelect.value);
      this._save();
    });
  }

  applySettings() {
    this.threeScene.setMusicVolume(parseFloat(this.musicInput.value));
    this.threeScene.setSFXVolume(parseFloat(this.sfxInput.value));
    this.threeScene.setQuality(this.qualitySelect.value);
  }

  _save() {
    const data = {
      musicVolume: parseFloat(this.musicInput.value),
      sfxVolume: parseFloat(this.sfxInput.value),
      quality: this.qualitySelect.value,
    };
    localStorage.setItem("honeyHiveConfig", JSON.stringify(data));
  }
}
