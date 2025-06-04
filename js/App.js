// js/App.js

import { AssetService } from "./services/AssetService.js";
import { LoadingScreen } from "./components/LoadingScreen.js";
import { IntroScreen } from "./components/IntroScreen.js";
import { ResourceBar } from "./components/ResourceBar.js";
import { SoundToggle } from "./components/SoundToggle.js";
import { ThreeScene } from "./three/ThreeScene.js";
import { GameManager } from "./GameManager.js";
import { getElement } from "./utils/domHelper.js";
import { UpgradeToggle } from "./components/UpgradeToggle.js";
import { upgradeConfig } from "./config/upgrades.js";
import gsap from "https://esm.sh/gsap";
/**
 * Clase principal que orquesta el flujo completo:
 *  1. Pantalla de carga → AssetService.loadAll()
 *  2. IntroScreen
 *  3. Inicializa ThreeScene + UI components + GameManager
 *  4. Play Game → animaciones y arranque de bucle de render
 */
class App {
  constructor(rootSelector) {
    this.rootEl = getElement(rootSelector);
    this.sceneContainer = getElement(".scene-container");

    this.upgradeToggle = new UpgradeToggle();

    // 1) Inicializamos pantalla de carga
    this.loadingScreen = new LoadingScreen();

    // 2) Creamos AssetService pasándole el callback de progreso
    this.assetService = new AssetService((loaded, total, url, percent) => {
      this.loadingScreen.updateProgress(loaded, total, url, percent);
    });

    // 3) Iniciamos carga de todos los assets
    this.assetService
      .loadAll()
      .then((assets) => {
        // 1) Todos los assets cargaron, ahora ocultamos la pantalla de carga
        return this.loadingScreen.hide().then(() => assets);
      })
      .then((assets) => {
        const hasSave = !!localStorage.getItem("honeyHiveSave");
        // 2) mostramos el IntroScreen
        this.introScreen = new IntroScreen(
          () => this._onNewGame(),
          () => this._onContinue(),
          hasSave
        );
        this.introScreen.show();

        // 3) Guardamos los assets
        this.assets = assets;

        // 4) Inicializamos ThreeScene
        
        this.threeScene = new ThreeScene(this.sceneContainer, this.assets, (delta) =>
          this.gameManager.productionLoop(delta)
        );

        // 5) Creamos ResourceBar (actualiza valores superiores)
        this.resourceBar = new ResourceBar();

        // 6) Creamos SoundToggle (música)
        this.soundToggle = new SoundToggle(this.threeScene.music);

        // 7) Contenedor donde se generarán las tarjetas
        this.upgradeContainer = getElement(".upgrade-bar .content-scroll");

        // 8) Instanciamos GameManager inyectando dependencias
        this.gameManager = new GameManager(
          this.threeScene,
          this.resourceBar,
          this.upgradeContainer,
          upgradeConfig,
          this.soundToggle,
          { saveInterval: 30000 }
        );

        // 9) Ahora que GameManager está listo, iniciamos el bucle de render
        this.threeScene.startRenderLoop();
      })
      .catch((err) => {
        console.error("Error cargando assets:", err);
      });
  }

  _startGame() {
    // 4) Ocultamos la intro y simultáneamente mostramos upgrade-bar y header
    this.introScreen.hide();

    // Mostramos con animación la upgrade bar desde abajo
    const upgradeBarEl = getElement(".upgrade-bar");
    gsap.fromTo(
      upgradeBarEl,
      { opacity: 0 },
      { opacity: 1, display: "flex",duration: 2 }
    );

    // Mostramos header
    const headerEl = getElement(".app-header");
    gsap.to(headerEl, { opacity: 1, duration: 2 });

    this.threeScene.startMusic();

    // Ejecutamos animación de “playGame” (mover cámara)
    this.threeScene.playGameAnimation();
    this.gameManager.startAutoSave();
  }

  _onNewGame() {
    this._startGame();
  }

  _onContinue() {
    const data = localStorage.getItem("honeyHiveSave");
    if (data) {
      this.gameManager.loadState(JSON.parse(data));
    }
    this._startGame();
  }
}

// Arrancamos la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new App(".colmena-app");
});
