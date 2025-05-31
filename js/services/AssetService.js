// js/services/AssetService.js

import * as THREE from "https://esm.sh/three@0.174.0";
import { GLTFLoader } from "https://esm.sh/three@0.174.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://esm.sh/three@0.174.0/examples/jsm/loaders/RGBELoader.js";
import { HalfFloatType } from "https://esm.sh/three@0.174.0";
import { AudioLoader } from "https://esm.sh/three@0.174.0";

/**
 * Clase que gestiona la carga de todos los assets de la aplicación:
 * - Modelos GLTF (panal, abeja, avispa).
 * - HDR environment map.
 * - Audio (música, SFX).
 * - Texturas (césped).
 *
 * Utiliza THREE.LoadingManager para reportar progreso externo (p. ej. LoadingScreen).
 */
export class AssetService {
  static ASSETS_URLS = {
    HIVE_GLTF:
      "assets/model/panal.glb",
    BEE_GLTF:
      "assets/model/minecraft_bee.glb",
    WASP_GLTF:
      "assets/model/wasp.glb",
    HDR_URL:
      "assets/hdr/minedump_flats_1k.hdr",
    MUSIC_URL:
      "assets/sound/music2.mp3",
    GRASS_TEXTURE:
      "assets/texture/grass2.png",
    POP_SFX:
      "assets/sound/pop-2.mp3",
    BEE_SFX:
      "assets/sound/bee-sound.mp3",
    WASP_SFX:
      "assets/sound/wasp-sound.mp3",
  };

  constructor(onProgressCallback) {
    /**
     * onProgressCallback(loaded, total, url) → se llama en cada evento onProgress de LoadingManager
     */
    this.onProgressCallback = onProgressCallback;
    this.assets = {};
    this._setupLoadingManager();
  }

  _setupLoadingManager() {
    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onStart = (url, loaded, total) => {
      console.log(`Started loading ${url} (${loaded}/${total})`);
    };
    this.loadingManager.onProgress = (url, loaded, total) => {
      console.log(`Loading ${url} (${loaded}/${total})`);
      if (typeof this.onProgressCallback === "function") {
        const percent = Math.floor((loaded / total) * 100);
        this.onProgressCallback(loaded, total, url, percent);
      }
    };
    this.loadingManager.onLoad = () => {
      console.log("All assets loaded");
    };

    // Instancias de loaders que usan el mismo loadingManager
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.hdrLoader = new RGBELoader(this.loadingManager).setDataType(HalfFloatType);
    this.audioLoader = new AudioLoader(this.loadingManager);
  }

  /**
   * Carga un GLTF y lo guarda en this.assets[key].
   * @param {string} url
   * @param {string} key
   * @returns {Promise<void>}
   */
  _loadGLTF(url, key) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.assets[key] = gltf;
          resolve();
        },
        undefined,
        (err) => {
          console.error(`Error cargando GLTF ${url}:`, err);
          reject(err);
        }
      );
    });
  }

  /**
   * Carga un HDR y lo guarda en this.assets.hdrEquirect.
   * @param {string} url
   * @returns {Promise<void>}
   */
  _loadHDR(url) {
    return new Promise((resolve, reject) => {
      this.hdrLoader.load(
        url,
        (hdrEquirect) => {
          this.assets.hdrEquirect = hdrEquirect;
          resolve();
        },
        undefined,
        (err) => {
          console.error(`Error cargando HDR ${url}:`, err);
          reject(err);
        }
      );
    });
  }

  /**
   * Carga un audio (buffer) y lo guarda en this.assets[key].
   * @param {string} url
   * @param {string} key
   */
  _loadAudioBuffer(url, key) {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        url,
        (buffer) => {
          this.assets[key] = buffer;
          resolve();
        },
        undefined,
        (err) => {
          console.error(`Error cargando audio ${url}:`, err);
          reject(err);
        }
      );
    });
  }

  /**
   * Carga una textura de césped, la configura para repetición y la guarda en this.assets.grassTexture.
   * @param {string} url
   */
  _loadGrassTexture(url) {
    return new Promise((resolve, reject) => {
      const texLoader = new THREE.TextureLoader(this.loadingManager);
      texLoader.load(
        url,
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          // El tamaño de repetición se ajustará en ThreeScene al crear el suelo
          this.assets.grassTexture = texture;
          resolve();
        },
        undefined,
        (err) => {
          console.error(`Error cargando textura ${url}:`, err);
          reject(err);
        }
      );
    });
  }

  /**
   * Inicia la carga de todos los assets y devuelve una promesa que resuelve cuando todos terminen.
   * Las claves en this.assets serán:
   *   hiveGLTF, beeGLTF, waspGLTF, hdrEquirect,
   *   musicBuffer, soundPlopBuffer, soundBeeBuffer, soundWaspBuffer,
   *   grassTexture
   */
  loadAll() {
    const urls = AssetService.ASSETS_URLS;
    return Promise.all([
      this._loadGLTF(urls.HIVE_GLTF, "hiveGLTF"),
      this._loadGLTF(urls.BEE_GLTF, "beeGLTF"),
      this._loadGLTF(urls.WASP_GLTF, "waspGLTF"),
      this._loadHDR(urls.HDR_URL),
      this._loadAudioBuffer(urls.MUSIC_URL, "musicBuffer"),
      this._loadGrassTexture(urls.GRASS_TEXTURE),
      this._loadAudioBuffer(urls.POP_SFX, "soundPlopBuffer"),
      this._loadAudioBuffer(urls.BEE_SFX, "soundBeeBuffer"),
      this._loadAudioBuffer(urls.WASP_SFX, "soundWaspBuffer"),
    ]).then(() => {
      // Al terminar la carga, podemos deshacernos de loaders pesados si hace falta:
      // this.hdrLoader.dispose();
      // this.gltfLoader.dispose();
      return this.assets;
    });
  }
}
