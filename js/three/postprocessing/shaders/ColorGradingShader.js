export const ColorGradingShader = {
  name: "HoneyHiveColorGradingShader",
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1 },
    contrast: { value: 1 },
    brightness: { value: 0 },
    gamma: { value: 1 },
    exposure: { value: 1 },
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
    uniform float saturation;
    uniform float contrast;
    uniform float brightness;
    uniform float gamma;
    uniform float exposure;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb *= exposure;
      float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(luminance), color.rgb, saturation);
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      color.rgb += brightness;
      color.rgb = pow(max(color.rgb, vec3(0.0)), vec3(1.0 / max(gamma, 0.0001)));
      gl_FragColor = color;
    }
  `,
};
