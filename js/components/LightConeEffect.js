// LightConeEffect.js

import * as THREE from "https://esm.sh/three@0.174.0";

export class LightConeEffect {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Vector3} position    – posición del ápice (punta) del cono
   * @param {Object} options            – height, radius, particleCount, coneColor
   */
  constructor(scene, camera, renderer, position, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.position = position.clone();
    this.height = options.height ?? 15;
    this.radius = options.radius ?? 5;
    this.particleCount = options.particleCount ?? 200;
    this.coneColor = options.coneColor ?? 0xffffff;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Estado de animación
    this.isAnimating = false;
    this.animationTimer = 0;
    this.phase = 0; // 0: inactivo, 1: aparición, 2: explosión, 3: desvanecer

    // Crear elementos
    this._createCone();
    this._createParticles();
    this._createFakeGodRays();

    this.scene.add(this.group);
    this.clock = new THREE.Clock();
  }

  // Genera un canvas con degradado vertical para el cono
  _makeConeGradientTexture() {
    const W = 128, H = 256;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0.0, "rgba(255,255,255,0.8)");
    grad.addColorStop(0.6, "rgba(255,255,255,0.2)");
    grad.addColorStop(1.0, "rgba(255,255,255,0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  _createCone() {
    const geom = new THREE.ConeGeometry(this.radius, this.height, 32, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      map: this._makeConeGradientTexture(),
      color: this.coneColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.coneMesh = new THREE.Mesh(geom, mat);
    this.coneMesh.rotation.x = 0.5 * Math.PI; // Apuntar hacia abajo
    this.coneMesh.position.y = - this.height / 2;
    this.group.add(this.coneMesh);
    this.targetConeOpacity = 0.6;
  }

  _makeSparkTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createRadialGradient(
      size/2, size/2, 0,
      size/2, size/2, size/2
    );
    grad.addColorStop(0.0, "rgba(255,255,255,1)");
    grad.addColorStop(0.2, "rgba(255,255,255,0.8)");
    grad.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  _createParticles() {
    const positions = new Float32Array(this.particleCount * 3);
    this.particleData = [];

    for (let i = 0; i < this.particleCount; i++) {
      const y = Math.random() * this.height;
      const localR = (y / this.height) * this.radius;
      const theta = Math.random() * Math.PI * 2;
      const x = localR * Math.cos(theta);
      const z = localR * Math.sin(theta);
      positions[3*i + 0] = x;
      positions[3*i + 1] = y;
      positions[3*i + 2] = z;
      this.particleData.push({
        speed: (Math.random() * 0.5 + 0.1) * (Math.random() < 0.5 ? -1 : 1),
        baseSpeed: null
      });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const sparkTex = this._makeSparkTexture();
    const mat = new THREE.PointsMaterial({
      size: 0.1,
      map: sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0
    });

    this.particleSystem = new THREE.Points(geom, mat);
    this.particleSystem.renderOrder = 1;
    this.group.add(this.particleSystem);
    this.targetParticleOpacity = 1;
  }

  _makeRayGradientTexture() {
    const W = 64, H = 256;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0.0, "rgba(255,255,255,0.5)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.1)");
    grad.addColorStop(1.0, "rgba(255,255,255,0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    return new THREE.CanvasTexture(canvas);
  }

  _createFakeGodRays() {
    this.rayPlanes = [];
    const rayTexture = this._makeRayGradientTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: rayTexture,
      color: 0xffeebb,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const numPlanes = 6;
    for (let i = 0; i < numPlanes; i++) {
      const geom = new THREE.PlaneGeometry(this.radius * 2, this.height);
      const mesh = new THREE.Mesh(geom, mat.clone());
      mesh.position.y = this.height / 2;
      mesh.rotation.x = 0;
      const angle = (i / numPlanes) * Math.PI * -2;
      mesh.rotation.y = angle;
      this.group.add(mesh);
      this.rayPlanes.push(mesh);
    }
    this.targetRayOpacity = 0.3;
  }

  // Llamar para iniciar animación de aparición/explosión/desvanecimiento
  triggerAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.animationTimer = 0;
    this.phase = 1;
    // Guardar velocidades base para resetear
    this.particleData.forEach(d => d.baseSpeed = d.speed);
  }

  update() {
    const delta = this.clock.getDelta();
    if (this.isAnimating) this._animateEffect(delta);
    this._updateParticles(delta);
  }

  _updateParticles(delta) {
    const posArr = this.particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const idx = 3 * i;
      let y = posArr[idx + 1];
      const data = this.particleData[i];
      y += data.speed * delta * 2;
      if (y < 0) y = this.height;
      if (y > this.height) y = 0;
      posArr[idx + 1] = y;
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  _animateEffect(delta) {
    this.animationTimer += delta;
    const durationAppear = 2; // segundos
    const durationExplode = 0.4;
    const durationFade = 2;

    if (this.phase === 1) {
      // Aparición: incrementar opacidades de cono, rayos y partículas
      const t = Math.min(this.animationTimer / durationAppear, 1);
      this.coneMesh.material.opacity = this.targetConeOpacity * t;
      this.particleSystem.material.opacity = this.targetParticleOpacity * t;
      this.rayPlanes.forEach(p => p.material.opacity = this.targetRayOpacity * t);
      if (t >= 1) {
        this.phase = 2;
        this.animationTimer = 0;
        // Hacer explosión: aumentar velocidad temporalmente
        this.particleData.forEach(d => d.speed = d.baseSpeed * 5);
      }
    } else if (this.phase === 2) {
      // Explosión breve: mantener altas velocidades
      if (this.animationTimer >= durationExplode) {
        this.phase = 3;
        this.animationTimer = 0;
        // Restaurar velocidades base
        this.particleData.forEach(d => d.speed = d.baseSpeed);
      }
    } else if (this.phase === 3) {
      // Desvanecimiento: reducir opacidades a 0
      const t = Math.min(this.animationTimer / durationFade, 1);
      const inv = 1 - t;
      this.coneMesh.material.opacity = this.targetConeOpacity * inv;
      this.particleSystem.material.opacity = this.targetParticleOpacity * inv;
      this.rayPlanes.forEach(p => p.material.opacity = this.targetRayOpacity * inv);
      if (t >= 1) {
        this.phase = 0;
        this.isAnimating = false;
      }
    }
  }
}
