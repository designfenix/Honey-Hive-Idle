// js/components/AchievementsMenu.js
import { getElement, createElement } from "../utils/domHelper.js";

export class AchievementsMenu {
  constructor(achievements) {
    this.achievements = achievements;
    this.menuEl = getElement(".achievements-menu");
    this.openBtn = getElement("#achievements-button");
    this.closeBtn = getElement("#achievements-close");
    this.listEl = this.menuEl.querySelector(".achievement-list");
    this.unlocked = new Set(
      JSON.parse(localStorage.getItem("honeyHiveAchievements") || "[]")
    );

    this.openBtn.addEventListener("click", () =>
      this.menuEl.classList.add("open")
    );
    this.closeBtn.addEventListener("click", () =>
      this.menuEl.classList.remove("open")
    );

    this.achievements.forEach((a) => {
      const li = createElement(
        "li",
        { "data-id": a.id },
        this.listEl
      );
      createElement("span", { className: "title", textContent: a.title }, li);
      createElement(
        "span",
        { className: "desc", textContent: a.description },
        li
      );
      if (this.unlocked.has(a.id)) li.classList.add("unlocked");
    });
  }

  _save() {
    localStorage.setItem(
      "honeyHiveAchievements",
      JSON.stringify([...this.unlocked])
    );
  }

  _showToast(title) {
    const toast = createElement(
      "div",
      { className: "achievement-toast", textContent: `Achievement Unlocked: ${title}!` },
      document.body
    );
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => toast.remove());
    }, 3000);
  }

  check(state) {
    this.achievements.forEach((a) => {
      if (this.unlocked.has(a.id)) return;
      let ok = false;
      switch (a.type) {
        case "bees":
          ok = state.bees >= a.value;
          break;
        case "wasps":
          ok = state.wasps >= a.value;
          break;
        case "ducks":
          ok = state.ducks >= a.value;
          break;
        case "userLevel":
          ok = state.userLevel >= a.value;
          break;
        case "prodLevel":
          ok = state.prodLevel >= a.value;
          break;
        case "hiveLevel":
          ok = state.hiveLevel >= a.value;
          break;
        case "pollenLifetime":
          ok = state.pollenLifetime >= a.value;
          break;
        case "pollen":
          ok = state.pollen >= a.value;
          break;
        case "nectar":
          ok = state.nectar >= a.value;
          break;
      }
      if (ok) {
        this.unlocked.add(a.id);
        const li = this.listEl.querySelector(`li[data-id="${a.id}"]`);
        if (li) li.classList.add("unlocked");
        this._save();
        this._showToast(a.title);
      }
    });
  }
}
