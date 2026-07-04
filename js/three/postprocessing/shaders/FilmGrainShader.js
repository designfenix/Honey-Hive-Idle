export const FilmGrainShader = {
  name: "HoneyHiveFilmGrainShader",
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    noiseIntensity: { value: 0.35 },
    scanlineIntensity: { value: 0.12 },
    grayscale: { value: false },
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
    uniform float time;
    uniform float noiseIntensity;
    uniform float scanlineIntensity;
    uniform bool grayscale;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      float grain = random(vUv + time * 0.01) - 0.5;
      float scanline = sin(vUv.y * 900.0) * 0.5 + 0.5;
      vec3 color = base.rgb + grain * noiseIntensity;
      color *= 1.0 - scanline * scanlineIntensity;

      if (grayscale) {
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = vec3(luma);
      }

      gl_FragColor = vec4(color, base.a);
    }
  `,
};
