export const PixelationShader = {
  name: "HoneyHivePixelationShader",
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: null },
    pixelSize: { value: 4 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    varying vec2 vUv;

    void main() {
      vec2 pixels = max(resolution / max(pixelSize, 1.0), vec2(1.0));
      vec2 uv = (floor(vUv * pixels) + 0.5) / pixels;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `,
};
