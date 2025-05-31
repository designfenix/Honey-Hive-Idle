"// js/three/ThreeScene.js

import * as THREE from "https://esm.sh/three@0.174.0";
import { OrbitControls } from "https://esm.sh/three@0.174.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "https://esm.sh/three@0.174.0/examples/jsm/shaders/GammaCorrectionShader.js";
import { PMREMGenerator, HalfFloatType } from "https://esm.sh/three@0.174.0";
import Stats from "https://esm.sh/stats.js@0.17.0";

// Parámetros estáticos de ThreeScene
const FOG_COLOR = 0x355e54;
const FOG_NEAR = 4;
const FOG_FAR = 20;

export class ThreeScene {
  /**
   * @param {Element} containerEl - contenedor que envuelve el <canvas> (#three-canvas).
   * @param {Object} assets - objeto con todos los assets cargados en AssetService.
   * @param {Function} onBeforeRender - callback que se ejecuta cada frame antes de renderizar 
   *                                    (ideales para actualizar lógica externa, p. ej. GameManager).
   */
  constructor(containerEl, assets, onBeforeRender) {
    this.containerEl = containerEl;
    this.assets = assets;
    this.onBeforeRender = onBeforeRender;

    // Tres.js clock
    this.clock = new THREE.Clock();

    // Configuración inicial de la escena
    this._initRenderer();
    this._initScene();
    this._initCameraAndControls();
    this._initPostProcessing();
    this._initAudioListener();
    this._initLights();
    this._initEnvironment();
    this._initGround();
    this._initForest();
    this._initRock();
    this._initVegetation();
    this._initHive();
    this._initBeesMixer();

    // Stats
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // Resize handling
    window.addEventListener("resize", () => this._onResize());
  }

  // -------------------------
  //  1. Configuración del renderer y canvas
  // -------------------------
  _initRenderer() {
    const canvas = document.querySelector("#three-canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(
      this.containerEl.clientWidth,
      this.containerEl.clientHeight,
      false
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.physicallyCorrectLights = true;
  }

  // -------------------------
  //  2. Escena y niebla
  // -------------------------
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
  }

  // -------------------------
  //  3. Cámara, posición y controles
  // -------------------------
  _initCameraAndControls() {
    const aspect = this.containerEl.clientWidth / this.containerEl.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 100);
    // Posición inicial lejana, se moverá en _playGame()
    this.camera.position.set(-1.12, 20.5, 10);
    this.camera.rotation.set(-0.01, 10.23, 0);
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.minDistance = 3;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  // -------------------------
  //  4. Post-processing (RenderPass, Bokeh, Gamma)
  // -------------------------
  _initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bokehParams = {
      focus: 3,
      aperture: 0.001,
      maxblur: 0.01,
      width: this.containerEl.clientWidth,
      height: this.containerEl.clientHeight,
    };
    const bokehPass = new BokehPass(this.scene, this.camera, bokehParams);
    this.composer.addPass(bokehPass);

    const gammaPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaPass);
  }

  // -------------------------
  //  5. AudioListener + música y SFX
  // -------------------------
  _initAudioListener() {
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // Música de fondo
    this.music = new THREE.Audio(this.listener);
    this.music.setBuffer(this.assets.musicBuffer);
    this.music.setLoop(true);
    this.music.setVolume(0.2);
    this.music.play();

    // SFX: plop, abeja, avispa
    this.plopSound = new THREE.Audio(this.listener);
    this.plopSound.setBuffer(this.assets.soundPlopBuffer);
    this.plopSound.setVolume(1);

    this.beeSound = new THREE.Audio(this.listener);
    this.beeSound.setBuffer(this.assets.soundBeeBuffer);
    this.beeSound.setVolume(1);

    this.waspSound = new THREE.Audio(this.listener);
    this.waspSound.setBuffer(this.assets.soundWaspBuffer);
    this.waspSound.setVolume(1);
  }

  // -------------------------
  //  6. Luces básicas: hemi + directional
  // -------------------------
  _initLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xff9966, 1.5);
    const d = 50;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 100;
    sun.position.set(-5, 8, 8);
    sun.shadow.mapSize.set(2048, 2048);
    sun.castShadow = true;
    this.scene.add(sun);
  }

  // -------------------------
  //  7. Environment (HDR) o color de fondo
  // -------------------------
  _initEnvironment() {
    const pmremGenerator = new PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    if (this.assets.hdrEquirect) {
      const envMap = pmremGenerator.fromEquirectangular(
        this.assets.hdrEquirect
      ).texture;
      this.scene.background = envMap;
      this.scene.traverse((obj) => {
        if (obj.isMesh) obj.environmentIntensity = 1;
      });
      this.assets.hdrEquirect.dispose();
      pmremGenerator.dispose();
    } else {
      this.scene.background = new THREE.Color(0x8ed8f2);
    }
  }

  // -------------------------
  //  8. Suelo con textura de césped
  // -------------------------
  _initGround() {
    const size = 800;
    const tileSize = 50;
    const repeats = size / tileSize;
    const grassTexture = this.assets.grassTexture;
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(repeats, repeats);
    grassTexture.anisotropy =
      this.renderer.capabilities.getMaxAnisotropy();

    const mat = new THREE.MeshStandardMaterial({
      map: grassTexture,
      flatShading: true,
      metalness: 0.6,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(size, size);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.position.y = -0.01;
    this.scene.add(mesh);
  }

  # Additional files omitted due to message length constraints
}

