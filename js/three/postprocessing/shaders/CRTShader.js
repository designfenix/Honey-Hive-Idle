export const CRTShader = {
  name: "HoneyHiveCRTShader",
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: null },
    time: { value: 0 },
    scanlines: { value: 0.45 },
    curvature: { value: 0.18 },
    chromaticAberration: { value: 0.0025 },
    grain: { value: 0.14 },
    noise: { value: 0.08 },
    flicker: { value: 0.04 },
    barrelDistortion: { value: 0.08 },
    vignette: { value: 0.35 },
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
    uniform float time;
    uniform float scanlines;
    uniform float curvature;
    uniform float chromaticAberration;
    uniform float grain;
    uniform float noise;
    uniform float flicker;
    uniform float barrelDistortion;
    uniform float vignette;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec2 distort(vec2 uv) {
      vec2 centered = uv * 2.0 - 1.0;
      float r2 = dot(centered, centered);
      centered *= 1.0 + r2 * barrelDistortion;
      centered.x *= 1.0 + curvature * centered.y * centered.y;
      centered.y *= 1.0 + curvature * centered.x * centered.x;
      return centered * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = distort(vUv);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      vec2 aberration = vec2(chromaticAberration, 0.0);
      float r = texture2D(tDiffuse, uv + aberration).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - aberration).b;
      vec3 color = vec3(r, g, b);

      float line = sin(uv.y * resolution.y * 3.14159);
      color *= 1.0 - scanlines * (0.5 + 0.5 * line) * 0.45;

      float n = random(uv * resolution.xy + time * 37.0);
      color += (n - 0.5) * noise;
      color = mix(color, color * (0.85 + n * 0.3), grain);
      color *= 1.0 + sin(time * 38.0) * flicker;

      vec2 d = uv - 0.5;
      color *= 1.0 - smoothstep(0.25, 0.82, dot(d, d) * 2.0) * vignette;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
