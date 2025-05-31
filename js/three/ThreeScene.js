// js/three/ThreeScene.js

import * as THREE from "https://esm.sh/three@0.174.0";
import { OrbitControls } from "https://esm.sh/three@0.174.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "https://esm.sh/three@0.174.0/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "https://esm.sh/three@0.174.0/examples/jsm/shaders/GammaCorrectionShader.js";
import { PMREMGenerator, HalfFloatType } from "https://esm.sh/three@0.174.0";
import Stats from "https://esm.sh/stats.js@0.17.0";
import gsap from "https://esm.sh/gsap@3.13.0";


// Parámetros estáticos de ThreeScene
const FOG_COLOR = 0x355e54;
const FOG_NEAR = 4;
const FOG_FAR = 20;

export class ThreeScene {
  /**
   * @param {Element} containerEl - contenedor que envuelve el <canvas> (#three-canvas).
   * @param {Object} assets - objeto con todos los assets cargados en AssetService.
   * @param {Function} onBeforeRender - callback que se ejecuta cada frame antes de renderizar.
   */
  constructor(containerEl, assets, onBeforeRender) {
    this.containerEl = containerEl;
    this.assets = assets;
    this.onBeforeRender = onBeforeRender;

    // Tres.js clock
    this.clock = new THREE.Clock();

    // Parámetro dinámico para velocidad de colmena (se reasigna desde GameManager)
    this.hiveSpeedMultiplierFunc = () => 1;

    // 1. Inicializar renderer y canvas
    this._initRenderer();

    // 2. Configurar escena y niebla
    this._initScene();

    // 3. Configurar cámara y controles
    this._initCameraAndControls();

    // 4. Configurar post-proceso
    this._initPostProcessing();

    // 5. Configurar AudioListener y audio
    this._initAudioListener();

    // 6. Configurar luces
    this._initLights();

    // 7. Configurar entorno (HDR o color de fondo)
    this._initEnvironment();

    // 8. Configurar objetos del suelo, bosque, rocas, vegetación, colmena y bees mixer
    this._initGround();
    this._initForest();
    this._initRock();
    this._initVegetation();
    this._initHive();
    this._initBeesMixer();

    // 9. Stats (FPS)
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // 10. Resize handling
    window.addEventListener("resize", () => this._onResize());
  }

  // -----------------------------------
  // 1. Configuración del renderer y canvas
  // -----------------------------------
  _initRenderer() {
    const canvas = this.containerEl.querySelector("#three-canvas");
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

  // -----------------------------------
  // 2. Escena y niebla
  // -----------------------------------
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
  }

  // -----------------------------------
  // 3. Cámara, posición y controles
  // -----------------------------------
  _initCameraAndControls() {
    const aspect =
      this.containerEl.clientWidth / this.containerEl.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 100);
    // Posición inicial alejada; luego se moverá en playGameAnimation()
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

  // -----------------------------------
  // 4. Post-processing (RenderPass, Bokeh, Gamma)
  // -----------------------------------
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

  // -----------------------------------
  // 5. AudioListener + música y SFX
  // -----------------------------------
  _initAudioListener() {
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // Música de fondo
    this.music = new THREE.Audio(this.listener);
    this.music.setBuffer(this.assets.musicBuffer);
    this.music.setLoop(true);
    this.music.setVolume(0.2);

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

  startMusic() {
    if (this.music && !this.music.isPlaying) {
      this.music.play();
    }
  }

  // -----------------------------------
  // 6. Luces básicas: Hemisphere + Directional
  // -----------------------------------
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

  // -----------------------------------
  // 7. Environment (HDR) o color de fondo
  // -----------------------------------
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

  // -----------------------------------
  // 8. Suelo con textura de césped
  // -----------------------------------
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

  // -----------------------------------
  // 9. Crear bosque de árboles
  // -----------------------------------
  _initForest() {
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x553a30,
      flatShading: true,
    });
    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x4a7247,
      flatShading: true,
    });
    const treeCount = 500;
    const rMin = 8,
      rMax = 16;

    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = THREE.MathUtils.lerp(rMin, rMax, Math.random());
      const tree = new THREE.Group();

      // Tronco
      const trunkHeight = 1 + Math.random() * 3;
      const trunkGeo = new THREE.CylinderGeometry(
        0.3,
        0.3,
        trunkHeight,
        trunkHeight * 2
      );
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      // Hojas en forma de conos
      const baseLeavesHeight = trunkHeight * 0.8;
      const baseLeavesRadius = trunkHeight * 0.5;
      const crownCount = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < crownCount; j++) {
        const sizeFactor = 1 - j * 0.2;
        const leavesHeight = baseLeavesHeight * sizeFactor;
        const leavesRadius = baseLeavesRadius * sizeFactor;
        const leavesGeo = new THREE.ConeGeometry(leavesRadius, leavesHeight, 6);
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);

        const yOffset =
          trunkHeight +
          baseLeavesHeight * j * 0.6 +
          leavesHeight / 2;
        leaves.position.y = yOffset;
        leaves.castShadow = true;
        tree.add(leaves);
      }

      tree.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tree);
    }
  }

  // -----------------------------------
  // 10. Crear roca central
  // -----------------------------------
  _initRock() {
    const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x7a7a70,
      metalness: 0.6,
      roughness: 1,
      flatShading: true,
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.position.set(0, 0, 0);
    rock.scale.set(1.5, 0.8, 1.3);
    this.scene.add(rock);
  }

  // -----------------------------------
  // 11. Vegetación (césped y arbustos)
  // -----------------------------------
  _initVegetation() {
    // Definir forma de hoja
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.15, 0.1, 0.4, 0.15, 0.5, 0.4);
    leafShape.bezierCurveTo(0.55, 0.7, 0.3, 1.0, 0, 1.2);
    leafShape.bezierCurveTo(-0.3, 1.0, -0.55, 0.7, -0.5, 0.4);
    leafShape.bezierCurveTo(-0.4, 0.15, -0.15, 0.1, 0, 0);

    const extrudeSettings = {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 1,
    };
    const grassGeo = new THREE.ExtrudeGeometry(leafShape, extrudeSettings);
    grassGeo.rotateX(-Math.PI / 2);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4a7247,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Césped instanciado
    const grassCount = 600;
    const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    grassInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const rMin = 4,
      rMax = 8;
    for (let i = 0; i < grassCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = THREE.MathUtils.lerp(rMin, rMax, Math.random());
      dummy.position.set(
        Math.cos(a) * r + (Math.random() - 0.5) * 0.5,
        0,
        Math.sin(a) * r + (Math.random() - 0.5) * 0.5
      );
      dummy.rotation.y = Math.random() * Math.PI;
      const s = 0.1 + Math.random() * 0.2;
      dummy.scale.setScalar(s);

      dummy.updateMatrix();
      grassInst.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(grassInst);

    // Arbustos sueltos
    const bushGeo = new THREE.DodecahedronGeometry(0.5, 0);
    const bushMat = new THREE.MeshStandardMaterial({
      color: 0x7a7a70,
      flatShading: true,
    });
    const bushCount = 50;
    for (let i = 0; i < bushCount; i++) {
      const bush = new THREE.Mesh(bushGeo, bushMat);
      const a = Math.random() * Math.PI * 2;
      const r = THREE.MathUtils.lerp(rMax, rMax + 2, Math.random());
      bush.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      const s = 0.2 + Math.random() * 0.6;
      bush.scale.set(s, s * 0.6, s);
      bush.castShadow = true;
      bush.receiveShadow = true;
      this.scene.add(bush);
    }
  }

  // -----------------------------------
  // 12. Configurar panal (Hive)
  // -----------------------------------
  _initHive() {
    const gltf = this.assets.hiveGLTF;
    gltf.scene.traverse((node) => {
      if (!node.isMesh) return;
      const mat = node.material;
      mat.color.offsetHSL(0.12, 1.2, 1.0);
      mat.metalness = 1.0;
      mat.roughness = 0.4;
      mat.envMapIntensity = 1;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    this.hive = gltf.scene;
    this.hive.scale.setScalar(1);
    this.hive.position.y = 0.9;
    this.hive.rotation.y = -1.6;
    this.scene.add(this.hive);
  }

  // -----------------------------------
  // 13. Configurar AnimationMixer para abejas/avispas
  // -----------------------------------
  _initBeesMixer() {
    const gltf = this.assets.beeGLTF;
    this.beeMixer = new THREE.AnimationMixer(this.scene);
    // No estamos reproduciendo ninguna animación hasta que se spawnee una abeja/avispa
  }

  // -----------------------------------
  // 14. Setter para hiveSpeedMultiplier (invocado desde GameManager)
  // -----------------------------------
  setHiveSpeedMultiplier(fn) {
    this.hiveSpeedMultiplierFunc = fn;
  }

  // -----------------------------------
  // 15. Calcula la velocidad actual de colmena
  // -----------------------------------
  _hiveSpeedMultiplier() {
    return this.hiveSpeedMultiplierFunc();
  }

  // -----------------------------------
  // 16. Crear nueva abeja en la escena
  // -----------------------------------
  spawnBee() {
    this.beeSound.stop();
    this.beeSound.play();
    const gltf = this.assets.beeGLTF;
    const bee = gltf.scene.clone();
    bee.traverse((node) => {
      if (node.isMesh) node.castShadow = node.receiveShadow = true;
    });
    bee.scale.setScalar(0.1);

    // Posición “dentro del panal”
    const insideOffset = new THREE.Vector3(0, -0.2, 0);
    const insidePos = insideOffset.clone().applyMatrix4(this.hive.matrixWorld);

    // Punto de salida a radio 1
    const exitOffset = new THREE.Vector3(1, 0.05, 0);
    const exitPos = exitOffset.clone().applyMatrix4(this.hive.matrixWorld);

    bee.position.copy(insidePos);

    // Orientar hacia exitPos
    const toExit = new THREE.Vector3()
      .subVectors(exitPos, insidePos)
      .normalize();
    const yaw = Math.atan2(toExit.x, toExit.z) + Math.PI;
    bee.rotation.set(0, yaw, 0);

    // Parámetros de órbita
    const hiveCenter = new THREE.Vector3().setFromMatrixPosition(
      this.hive.matrixWorld
    );
    const dx = exitPos.x - hiveCenter.x;
    const dz = exitPos.z - hiveCenter.z;
    const orbitAngle = Math.atan2(dz, dx);
    const orbitRadius = Math.hypot(dx, dz);
    const orbitBaseY = exitPos.y;
    const orbitSpeed =
      (0.6 + Math.random() * 0.4) * this._hiveSpeedMultiplier();

    bee.userData = {
      phase: "exiting",
      exitPos,
      orbit: {
        angle: orbitAngle,
        radius: orbitRadius,
        baseY: orbitBaseY,
        speed: orbitSpeed,
      },
    };

    this.scene.add(bee);
    this.beeMixer.clipAction(gltf.animations[0], bee).play();
    return bee;
  }

  // -----------------------------------
  // 17. Crear nueva avispa en la escena
  // -----------------------------------
  spawnWasp() {
    this.waspSound.stop();
    this.waspSound.play();
    const gltf = this.assets.waspGLTF;
    const wasp = gltf.scene.clone();
    wasp.traverse((node) => {
      if (node.isMesh) node.castShadow = node.receiveShadow = true;
    });
    wasp.scale.setScalar(0.1);

    // Posición “dentro del panal”
    const insideOffset = new THREE.Vector3(0, -0.2, 0);
    const insidePos = insideOffset.clone().applyMatrix4(this.hive.matrixWorld);

    // Punto de salida a radio 2.5
    const exitOffset = new THREE.Vector3(2.5, 0.05, 0);
    const exitPos = exitOffset.clone().applyMatrix4(this.hive.matrixWorld);

    wasp.position.copy(insidePos);

    // Orientar hacia exitPos
    const toExit = new THREE.Vector3()
      .subVectors(exitPos, insidePos)
      .normalize();
    const yaw = Math.atan2(toExit.x, toExit.z) + Math.PI;
    wasp.rotation.set(0, yaw, 0);

    // Parámetros de órbita
    const hiveCenter = new THREE.Vector3().setFromMatrixPosition(
      this.hive.matrixWorld
    );
    const dx = exitPos.x - hiveCenter.x;
    const dz = exitPos.z - hiveCenter.z;
    const orbitAngle = Math.atan2(dz, dx);
    const orbitRadius = Math.hypot(dx, dz);
    const orbitBaseY = exitPos.y;
    const orbitSpeed =
      (0.4 + Math.random() * 0.4) * this._hiveSpeedMultiplier();

    wasp.userData = {
      phase: "exiting",
      exitPos,
      orbit: {
        angle: orbitAngle,
        radius: orbitRadius,
        baseY: orbitBaseY,
        speed: orbitSpeed,
      },
    };

    this.scene.add(wasp);
    this.beeMixer.clipAction(gltf.animations[0], wasp).play();
    return wasp;
  }

  // -----------------------------------
  // 18. Lógica de movimiento en órbita
  // -----------------------------------
  _moveInOrbit(entity, delta, hiveCenter) {
    const ud = entity.userData;
    if (ud.phase === "exiting") {
      const dir = new THREE.Vector3().subVectors(ud.exitPos, entity.position);
      const dist = dir.length();
      if (dist < 0.05) {
        // Cambiar a fase “orbit”
        const dx = entity.position.x - hiveCenter.x;
        const dz = entity.position.z - hiveCenter.z;
        const currentAngle = Math.atan2(dz, dx);
        ud.orbit.angle =
          currentAngle - this.clock.getElapsedTime() * ud.orbit.speed;
        ud.orbit.radius = Math.hypot(dx, dz);
        ud.orbit.baseY = entity.position.y;
        ud.phase = "orbit";
      } else {
        dir.normalize();
        entity.position.addScaledVector(dir, delta * 1.2);
      }
    } else {
      // Fase “orbit”
      const { angle, radius, baseY, speed } = ud.orbit;
      const t = this.clock.getElapsedTime();
      const a = angle + t * speed;
      entity.position.x = hiveCenter.x + Math.cos(a) * radius;
      entity.position.z = hiveCenter.z + Math.sin(a) * radius;
      // Oscilación vertical
      const verticalOsc = entity.userData === ud.exitPos ? 0.2 : 0.3;
      entity.position.y = baseY + Math.sin(t * speed * 2 + angle) * verticalOsc;
      entity.rotation.y = -a + Math.PI;
    }
  }

  // -----------------------------------
  // 19. Iniciar bucle de render
  // -----------------------------------
  startRenderLoop() {
    const renderFrame = () => {
      requestAnimationFrame(renderFrame);
      const delta = this.clock.getDelta();

      // Actualizar Mixer
      if (this.beeMixer) this.beeMixer.update(delta);

      // Producción y movimiento externo desde GameManager
      if (typeof this.onBeforeRender === "function") {
        this.onBeforeRender(delta);
      }

      // Movimiento en órbita para todas las entidades spawnadas
      const hiveCenter = new THREE.Vector3().setFromMatrixPosition(
        this.hive.matrixWorld
      );
      this.scene.traverse((obj) => {
        if (obj.userData && obj.userData.orbit) {
          this._moveInOrbit(obj, delta, hiveCenter);
        }
      });

      // Rotación automática de cámara
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.3;
      this.controls.target.set(0, 1, 0);

      // Actualizar Stats y controles
      this.stats.update();
      this.controls.update();

      // Renderizar escena y post-proceso
      this.renderer.render(this.scene, this.camera);
      this.composer.render();
    };

    renderFrame();
  }

  // -----------------------------------
  // 20. Animación de “playGame”: mover cámara al punto inicial
  // -----------------------------------
  playGameAnimation() {
    // Se asume que GSAP está disponible globalmente
    gsap.to(this.camera.position, {
      x: -1.12,
      y: 0.5,
      z: 3.55,
      ease: "power2.out",
      duration: 5,
    });
    gsap.to(this.camera.rotation, {
      x: -0.01,
      y: -0.23,
      z: 0,
      ease: "power2.out",
      duration: 5,
    });
    gsap.to(this.camera, {
      zoom: 1.19,
      ease: "power2.out",
      duration: 5,
      onUpdate: () => this.camera.updateProjectionMatrix(),
      onComplete: () => {
        this.controls.maxDistance = 7;
      },
    });
  }

  // -----------------------------------
  // 21. Ajustar tamaño al cambiar ventana
  // -----------------------------------
  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }
}
