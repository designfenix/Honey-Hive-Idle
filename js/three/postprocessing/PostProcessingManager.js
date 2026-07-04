import * as THREE from "https://esm.sh/three@0.174.0";
import { EffectComposer } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutlinePass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/OutlinePass.js";
import { GammaCorrectionShader } from "https://esm.sh/three@0.174.0/examples/jsm/shaders/GammaCorrectionShader.js";

import { POST_PROCESSING_DEFAULTS, POST_PROCESSING_MODES } from "./PostProcessingConfig.js";
import { ToonShader } from "./shaders/ToonShader.js";
import { CRTShader } from "./shaders/CRTShader.js";
import { ColorGradingShader } from "./shaders/ColorGradingShader.js";
import { PixelationShader } from "./shaders/PixelationShader.js";
import { FilmGrainShader } from "./shaders/FilmGrainShader.js";

const deepMerge = (target, source = {}) => {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = deepMerge({ ...(target[key] || {}) }, value);
    } else {
      target[key] = value;
    }
  }
  return target;
};

/**
 * Owns the complete post-processing stack for the Three.js scene.
 *
 * Passes are created once and toggled with `enabled` flags so runtime mode
 * changes avoid GPU allocation churn. Disabled passes are skipped by
 * EffectComposer, keeping the frame path as small as possible.
 */
export class PostProcessingManager {
  constructor(renderer, scene, camera, config = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();
    this.size = new THREE.Vector2();
    this.resolution = new THREE.Vector2(1, 1);
    this.outlineColor = new THREE.Color();
    this.config = deepMerge(this._cloneDefaults(), config);

    this.composer = new EffectComposer(renderer);
    this.composer.renderToScreen = this.config.renderToScreen;

    this._createPasses();
    this._addPassesInDisplayOrder();
    this.resize();
    this.applyConfig();
  }

  _cloneDefaults() {
    return JSON.parse(JSON.stringify(POST_PROCESSING_DEFAULTS));
  }

  _createPasses() {
    // Required base pass: renders the scene once into the composer buffer.
    this.renderPass = new RenderPass(this.scene, this.camera);

    // Object outlines provide the comic ink stroke around meshes. We select all
    // scene meshes each render so dynamically spawned bees/wasps are included.
    this.outlinePass = new OutlinePass(this.resolution, this.scene, this.camera);
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false;

    // Screen-space color quantization creates a lightweight cel-shaded palette
    // without replacing materials on gameplay assets.
    this.toonPass = new ShaderPass(ToonShader);

    // UnrealBloomPass is Three's modern bloom implementation for thresholded
    // emissive/highlight glow.
    this.bloomPass = new UnrealBloomPass(this.resolution, 0.55, 0.35, 0.82);

    // Color grading is intentionally one small shader: saturation, contrast,
    // brightness, gamma and exposure are adjusted in a single pass.
    this.colorGradingPass = new ShaderPass(ColorGradingShader);

    // Custom film shader supplies classic grain and scanline treatment with an
    // optional grayscale switch.
    this.filmPass = new ShaderPass(FilmGrainShader);

    // CRT pass combines curvature, aberration, distortion, scanlines, vignette
    // and flicker so CRT mode costs one extra full-screen draw.
    this.crtPass = new ShaderPass(CRTShader);
    this.crtPass.uniforms.resolution.value = this.resolution;

    // Pixelation happens after scene effects. DOM UI is not inside this canvas,
    // so the game's HTML HUD remains sharp while the 3D world is pixelated.
    this.pixelationPass = new ShaderPass(PixelationShader);
    this.pixelationPass.uniforms.resolution.value = this.resolution;

    // Keep gamma last so custom shaders can work in linear-ish color values and
    // the final canvas is corrected consistently.
    this.gammaPass = new ShaderPass(GammaCorrectionShader);
  }

  _addPassesInDisplayOrder() {
    [
      this.renderPass,
      this.outlinePass,
      this.toonPass,
      this.bloomPass,
      this.colorGradingPass,
      this.filmPass,
      this.crtPass,
      this.pixelationPass,
      this.gammaPass,
    ].forEach((pass) => this.composer.addPass(pass));
  }

  setMode(modeName) {
    if (!POST_PROCESSING_MODES[modeName]) {
      console.warn(`Unknown post-processing mode: ${modeName}`);
      return;
    }
    this.config.mode = modeName;
    this.update(POST_PROCESSING_MODES[modeName]);
  }

  enableBloom(enabled) {
    this.update({ bloom: { enabled } });
  }

  enablePixelation(enabled) {
    this.update({ pixelation: { enabled } });
  }

  update(partialConfig = {}) {
    this.config = deepMerge(this.config, partialConfig);
    this.applyConfig();
  }

  applyConfig() {
    const { toon, crt, bloom, colorGrading, film, pixelation } = this.config;

    this.outlinePass.enabled = Boolean(toon.enabled && toon.outline);
    this.outlinePass.edgeStrength = 4;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.edgeThickness = Math.max(0.001, toon.outlineThickness * 1000);
    this.outlineColor.set(toon.outlineColor);
    this.outlinePass.visibleEdgeColor.copy(this.outlineColor);
    this.outlinePass.hiddenEdgeColor.copy(this.outlineColor);

    this.toonPass.enabled = Boolean(toon.enabled && toon.quantization);
    this.toonPass.uniforms.enabled.value = toon.enabled ? 1 : 0;
    this.toonPass.uniforms.quantization.value = toon.quantization ? 1 : 0;
    this.toonPass.uniforms.colorLevels.value = toon.colorLevels;

    this.bloomPass.enabled = Boolean(bloom.enabled);
    this.bloomPass.threshold = bloom.threshold;
    this.bloomPass.strength = bloom.strength;
    this.bloomPass.radius = bloom.radius;

    this.colorGradingPass.enabled = Boolean(colorGrading.enabled);
    this.colorGradingPass.uniforms.saturation.value = colorGrading.saturation;
    this.colorGradingPass.uniforms.contrast.value = colorGrading.contrast;
    this.colorGradingPass.uniforms.brightness.value = colorGrading.brightness;
    this.colorGradingPass.uniforms.gamma.value = colorGrading.gamma;
    this.colorGradingPass.uniforms.exposure.value = colorGrading.exposure;

    this.filmPass.enabled = Boolean(film.enabled);
    this.filmPass.uniforms.noiseIntensity.value = film.noiseIntensity;
    this.filmPass.uniforms.scanlineIntensity.value = film.scanlineIntensity;
    this.filmPass.uniforms.grayscale.value = film.grayscale;

    this.crtPass.enabled = Boolean(crt.enabled);
    Object.entries(crt).forEach(([key, value]) => {
      if (this.crtPass.uniforms[key]) this.crtPass.uniforms[key].value = value;
    });

    this.pixelationPass.enabled = Boolean(pixelation.enabled);
    this.pixelationPass.uniforms.pixelSize.value = pixelation.pixelSize;
  }

  resize(width, height, pixelRatio = this.config.pixelRatio) {
    this.renderer.getSize(this.size);
    const displayWidth = width ?? this.size.x;
    const displayHeight = height ?? this.size.y;
    const ratio = Math.min(pixelRatio || 1, 2);
    this.config.pixelRatio = ratio;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(displayWidth, displayHeight, false);
    this.resolution.set(Math.max(1, displayWidth * ratio), Math.max(1, displayHeight * ratio));
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(displayWidth, displayHeight);
    this.outlinePass.setSize(displayWidth, displayHeight);
  }

  render(deltaTime = this.clock.getDelta()) {
    if (this.outlinePass.enabled) this._refreshOutlinedObjects();
    if (this.filmPass.enabled) this.filmPass.uniforms.time.value += deltaTime;
    if (this.crtPass.enabled) this.crtPass.uniforms.time.value += deltaTime;
    this.composer.render(deltaTime);
  }

  _refreshOutlinedObjects() {
    const selectedObjects = this.outlinePass.selectedObjects;
    selectedObjects.length = 0;
    this.scene.traverse((object) => {
      if (object.isMesh && object.visible) selectedObjects.push(object);
    });
  }
}
