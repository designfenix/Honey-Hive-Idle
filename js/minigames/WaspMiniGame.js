import { getElement } from "../utils/domHelper.js";

export class WaspMiniGame {
  constructor(onEnd) {
    this.overlay = getElement(".minigame-overlay");
    this.area = this.overlay.querySelector(".minigame-area");
    this.timerEl = this.overlay.querySelector("#minigame-timer");
    this.scoreEl = this.overlay.querySelector("#minigame-score");
    this.onEnd = onEnd;
    this.duration = 15;
    this.active = false;
    this._timer = null;
    this._spawnTimer = null;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.remaining = this.duration;
    this.score = 0;
    this._updateUI();
    this.area.innerHTML = "";
    this.overlay.classList.add("active");
    this._timer = setInterval(() => {
      this.remaining--;
      this._updateUI();
      if (this.remaining <= 0) this.end();
    }, 1000);
    this._spawnTimer = setInterval(() => this._spawnWasp(), 700);
  }

  _spawnWasp() {
    const el = document.createElement("div");
    el.className = "wasp-target";
    const maxX = this.area.clientWidth - 40;
    const maxY = this.area.clientHeight - 40;
    el.style.left = Math.random() * maxX + "px";
    el.style.top = Math.random() * maxY + "px";
    el.addEventListener("click", () => {
      el.remove();
      this.score++;
      this.scoreEl.textContent = this.score;
    });
    setTimeout(() => el.remove(), 1500);
    this.area.appendChild(el);
  }

  _updateUI() {
    this.timerEl.textContent = this.remaining;
    this.scoreEl.textContent = this.score;
  }

  end() {
    if (!this.active) return;
    clearInterval(this._timer);
    clearInterval(this._spawnTimer);
    this.overlay.classList.remove("active");
    this.area.innerHTML = "";
    this.active = false;
    if (this.onEnd) this.onEnd(this.score);
  }
}
