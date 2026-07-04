export const ToonShader = {
  name: "HoneyHiveToonShader",
  uniforms: {
    tDiffuse: { value: null },
    enabled: { value: 0 },
    quantization: { value: 1 },
    colorLevels: { value: 5 },
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
    uniform float enabled;
    uniform float quantization;
    uniform float colorLevels;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      if (enabled < 0.5 || quantization < 0.5) {
        gl_FragColor = color;
        return;
      }

      float levels = max(colorLevels, 2.0);
      vec3 quantized = floor(color.rgb * levels) / levels;
      // Keep a small blend with the original framebuffer so low-poly asset
      // textures remain readable while still achieving a comic/cel palette.
      color.rgb = mix(color.rgb, quantized, 0.82);
      gl_FragColor = color;
    }
  `,
};
