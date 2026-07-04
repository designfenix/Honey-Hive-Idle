export const POST_PROCESSING_DEFAULTS = Object.freeze({
  mode: "default",
  pixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2),
  renderToScreen: true,
  toon: {
    enabled: true,
    outline: true,
    outlineThickness: 0.0035,
    outlineColor: "#2d1606",
    quantization: true,
    colorLevels: 6,
  },
  crt: {
    enabled: false,
    scanlines: 0.45,
    curvature: 0.18,
    chromaticAberration: 0.0025,
    grain: 0.14,
    noise: 0.08,
    flicker: 0.04,
    barrelDistortion: 0.08,
    vignette: 0.35,
  },
  bloom: {
    enabled: true,
    threshold: 0.72,
    strength: 0.35,
    radius: 0.45,
  },
  colorGrading: {
    enabled: true,
    saturation: 1.16,
    contrast: 1.08,
    brightness: 0.015,
    gamma: 0.98,
    exposure: 1.04,
  },
  film: {
    enabled: true,
    noiseIntensity: 0.08,
    scanlineIntensity: 0.025,
    grayscale: false,
  },
  pixelation: {
    enabled: false,
    pixelSize: 4,
  },
});

export const POST_PROCESSING_MODES = Object.freeze({
  default: {},
  comic: {
    toon: { enabled: true, outline: true, quantization: true },
    crt: { enabled: false },
    film: { enabled: false },
    pixelation: { enabled: false },
  },
  crt: {
    crt: { enabled: true },
    film: { enabled: true, noiseIntensity: 0.18, scanlineIntensity: 0.08 },
    toon: { enabled: false },
    pixelation: { enabled: false },
  },
  pixel: {
    pixelation: { enabled: true },
    toon: { enabled: false },
  },
});
