export const POST_PROCESSING_DEFAULTS = Object.freeze({
  mode: "default",
  pixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2),
  renderToScreen: true,
  toon: {
    enabled: false,
    outline: true,
    outlineThickness: 0.003,
    outlineColor: "#000000",
    quantization: true,
    colorLevels: 5,
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
    enabled: false,
    threshold: 0.82,
    strength: 0.55,
    radius: 0.35,
  },
  colorGrading: {
    enabled: true,
    saturation: 1,
    contrast: 1,
    brightness: 0,
    gamma: 1,
    exposure: 1,
  },
  film: {
    enabled: false,
    noiseIntensity: 0.35,
    scanlineIntensity: 0.12,
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
