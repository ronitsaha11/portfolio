/**
 * THE LATTICE — shaders.
 *
 * Four programs, and each one exists because the alternative was worse,
 * not because a portfolio is expected to contain GLSL.
 *
 *   NODES        a lit sphere impostor on a billboard. One draw call
 *                for every node at any count, perfectly round at any
 *                zoom, with a glow that is part of the same fragment
 *                rather than a second pass over the whole screen.
 *   EDGES        a travelling intensity wave along each segment, so a
 *                connection reads as a channel carrying something.
 *   SIGNALS      round sprites for the packets moving between stages.
 *   ATMOSPHERE   a slow procedural depth field behind everything.
 *
 * WHY IMPOSTORS RATHER THAN SPHERE GEOMETRY
 *
 * A ten-segment sphere is 180 triangles and still looks faceted at the
 * sizes the accent nodes reach. A billboard is two triangles, and the
 * normal reconstructed from the quad gives a mathematically exact
 * sphere with real per-pixel lighting. At 280 nodes that is 560
 * triangles instead of 50,000, and it looks better.
 *
 * WHY THE LIGHTING IS ANALYTIC AND NOT three.js LIGHTS
 *
 * Three real lights through the standard material means a PBR shader,
 * tone mapping and an environment the rest of this scene does not have.
 * What the scene actually needs is a key that follows the reader's
 * pointer, a fill from above and a rim — which is three dot products.
 * It is a real lighting model; it is just written out.
 *
 * THE CORRIDOR
 *
 * Every program samples `uCorridor`. It thins the scene inside a band
 * of screen space where the reading column sits, so the lattice gets
 * out of the way of the text instead of being globally dimmed to a
 * level where it is safe everywhere. That is the difference between a
 * background that can be bright and one that cannot.
 */

/* ------------------------------------------------------------------ */
/* shared                                                              */
/* ------------------------------------------------------------------ */

/**
 * Screen-space attenuation inside the reading column, plus the depth
 * haze. Both are applied to alpha in every program, so the scene has
 * one answer to "how visible is this fragment" rather than four.
 */
const COMMON = /* glsl */ `
  uniform float uCorridor;
  uniform float uCorridorHalf;
  uniform float uCorridorCentre;
  uniform float uFogNear;
  uniform float uFogFar;

  float corridorMask(float ndcX) {
    float d = abs(ndcX - uCorridorCentre);
    float outside = smoothstep(uCorridorHalf, uCorridorHalf + 0.5, d);
    return mix(1.0 - uCorridor, 1.0, outside);
  }

  float depthFade(float viewDepth) {
    return 1.0 - smoothstep(uFogNear, uFogFar, viewDepth);
  }
`;

/* ------------------------------------------------------------------ */
/* nodes                                                               */
/* ------------------------------------------------------------------ */

export const nodeVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aGroup;
  attribute float aRank;

  uniform float uTime;
  uniform float uHalo;
  uniform float uFocus;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uPush;
  uniform float uEnergy;
  uniform float uIdle;
  uniform float uEvent;

  varying vec2 vQuad;
  varying vec3 vColor;
  varying float vDepth;
  varying float vNdcX;
  varying float vNear;
  varying float vLive;

  void main() {
    vColor = aColor;

    // Instance origin and uniform scale, straight out of the matrix.
    vec4 world = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float s = length(instanceMatrix[0].xyz);

    // The focused group grows; everything else steps back. One number
    // from the semantic stage list, and it is the only coupling the
    // list has to the scene.
    float focused = uFocus >= 0.0 ? (abs(aGroup - uFocus) < 0.5 ? 1.0 : 0.0) : 0.0;
    float dim = uFocus >= 0.0 ? mix(0.55, 1.9, focused) : 1.0;

    // Breath. Slow, out of phase per node, and it grows while the page
    // is idle — the system keeps working when nobody is watching.
    float breath = sin(uTime * 0.9 + aSeed * 6.2831) * 0.5 + 0.5;
    float live = 0.86 + breath * (0.16 + uIdle * 0.22) + uEnergy * 0.25;

    // A SYSTEM EVENT. Every eight to fourteen seconds a band of
    // brightness runs the length of the formation, in group order.
    // It is the one thing on the page that happens without the reader
    // doing anything, and it is what a system looks like from outside:
    // quiet, then something goes through it, then quiet again.
    float band = exp(-pow(uEvent * 2.6 - aGroup * 0.62 - 0.4, 2.0) * 1.6);
    live += band * 0.7;

    vLive = live * dim;

    vec4 mv = modelViewMatrix * world;
    vDepth = -mv.z;

    // Billboard: the quad is expanded in view space, so it always faces
    // the camera without a per-instance rotation.
    // Size hierarchy. A field of identical dots is a starfield; a
    // field with a few large nodes and many small ones reads as a
    // structure with hubs in it.
    float radius = s * (0.5 + breath * 0.04) * dim * (0.7 + aRank * aRank * 0.8);
    mv.xy += position.xy * radius * 2.0;

    vec4 clip = projectionMatrix * mv;

    // Pointer repulsion, in screen space, which is the space the reader
    // is actually pointing in. Falls off fast: this is presence, not a
    // force field.
    vec2 ndc = clip.xy / clip.w;
    vec2 delta = ndc - uPointer;
    float d = length(delta * vec2(uAspect, 1.0));
    float near = exp(-d * d * 5.0);
    vNear = near;
    clip.xy += normalize(delta + vec2(1e-5)) * near * uPush * clip.w;

    vNdcX = clip.x / clip.w;
    vQuad = position.xy * 2.0;
    gl_Position = clip;
  }
`;

export const nodeFragment = /* glsl */ `
  precision highp float;

  ${COMMON}

  uniform float uOpacity;
  uniform float uGlow;
  uniform float uHalo;
  uniform vec3 uLight;
  uniform vec3 uAccent;

  varying vec2 vQuad;
  varying vec3 vColor;
  varying float vDepth;
  varying float vNdcX;
  varying float vNear;
  varying float vLive;

  void main() {
    float d = length(vQuad);
    if (d > 1.0) discard;

    // The sphere occupies the inner fraction of the quad; the rest of
    // the quad is where the glow lives.
    float coreR = 1.0 / uHalo;
    float u = d / coreR;

    // Impostor normal. z is the height of the unit sphere at this point.
    float z = sqrt(max(0.0, 1.0 - min(1.0, u * u)));
    vec3 n = vec3(vQuad / max(coreR, 1e-4), z);

    float key = max(dot(n, uLight), 0.0);
    float fill = 0.5 + 0.5 * n.y;
    float rim = pow(1.0 - z, 3.0);

    vec3 lit = vColor * (0.14 + key * 0.95 + fill * 0.2) + vColor * rim * 0.5;

    // Anti-aliased core edge, then the halo outside it.
    float core = 1.0 - smoothstep(coreR * 0.88, coreR * 1.02, d);
    float halo = pow(max(0.0, 1.0 - d), 3.0);

    vec3 c = lit * core + mix(vColor, uAccent, vNear * 0.6) * halo * 0.38;
    c *= vLive * uGlow;
    c += uAccent * vNear * 0.35 * core;

    float a = (core + halo * 0.34) * uOpacity;
    a *= corridorMask(vNdcX) * depthFade(vDepth);

    if (a < 0.004) discard;
    gl_FragColor = vec4(c, a);
  }
`;

/* ------------------------------------------------------------------ */
/* edges                                                               */
/* ------------------------------------------------------------------ */

export const edgeVertex = /* glsl */ `
  attribute float aT;
  attribute float aSeed;
  attribute float aLen;

  varying float vT;
  varying float vSeed;
  varying float vLen;
  varying float vDepth;
  varying float vNdcX;

  void main() {
    vT = aT;
    vSeed = aSeed;
    vLen = aLen;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    vec4 clip = projectionMatrix * mv;
    vNdcX = clip.x / clip.w;
    gl_Position = clip;
  }
`;

export const edgeFragment = /* glsl */ `
  precision highp float;

  ${COMMON}

  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uEnergy;

  varying float vT;
  varying float vSeed;
  varying float vLen;
  varying float vDepth;
  varying float vNdcX;

  void main() {
    // A wave running from the upstream end to the downstream one. The
    // direction is the direction of the edge, which is the direction of
    // the system: every edge on this site joins group g to group g+1.
    float phase = vT * 2.6 - uTime * 1.1 + vSeed * 6.2831;
    float wave = 0.5 + 0.5 * sin(phase);
    float crest = pow(wave, 6.0);

    vec3 c = mix(uColor, uAccent, crest * (0.22 + uEnergy * 0.3));
    float a = uOpacity * (0.3 + wave * 0.34 + crest * 0.5);

    // LONG EDGES ARE NOT DRAWN. A graph where every pair is joined
    // across the whole frame is a ball of wool, and it is also a lie
    // about the structure: what matters is that a stage is next to the
    // stage after it. Past about eight world units the connection has
    // stopped saying anything and starts costing legibility.
    a *= 1.0 - smoothstep(5.0, 11.0, vLen);
    a *= corridorMask(vNdcX) * depthFade(vDepth);

    if (a < 0.003) discard;
    gl_FragColor = vec4(c * (0.8 + crest * 0.9), a);
  }
`;

/* ------------------------------------------------------------------ */
/* signals                                                             */
/* ------------------------------------------------------------------ */

export const signalVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;

  uniform float uScale;

  varying vec3 vColor;
  varying float vDepth;
  varying float vNdcX;

  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    vec4 clip = projectionMatrix * mv;
    vNdcX = clip.x / clip.w;
    gl_Position = clip;
    gl_PointSize = aSize * uScale / max(vDepth, 0.6);
  }
`;

export const signalFragment = /* glsl */ `
  precision highp float;

  ${COMMON}

  uniform float uOpacity;
  uniform float uGlow;

  varying vec3 vColor;
  varying float vDepth;
  varying float vNdcX;

  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float d = length(p);
    if (d > 1.0) discard;

    float core = 1.0 - smoothstep(0.0, 0.42, d);
    float glow = pow(max(0.0, 1.0 - d), 2.2);

    float a = (core * 0.9 + glow * 0.42) * uOpacity;
    a *= corridorMask(vNdcX) * depthFade(vDepth);

    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor * uGlow * (0.7 + core * 0.9), a);
  }
`;

/* ------------------------------------------------------------------ */
/* atmosphere                                                          */
/* ------------------------------------------------------------------ */

/**
 * A full-screen triangle drawn before everything else, with depth
 * testing off. The vertex shader ignores the camera entirely — the
 * positions are already in clip space — which is why this costs one
 * triangle rather than a plane that has to be kept in front of the
 * near plane.
 */
export const atmosphereVertex = /* glsl */ `
  varying vec2 vUvFull;

  void main() {
    vUvFull = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const atmosphereFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform float uEnergy;
  uniform float uIdle;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform vec3 uTint;
  uniform vec3 uAccent;
  uniform float uOpacity;

  varying vec2 vUvFull;

  // Value noise. Three octaves is enough for a field this soft, and a
  // fourth is invisible at the contrast this is drawn at.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUvFull;
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);

    // Two layers drifting at different rates and in different
    // directions, which is what stops it reading as a scrolling
    // texture. Both are slow enough that a still frame looks composed.
    float t = uTime * 0.022;
    float a = fbm(p * 1.7 + vec2(t, -t * 0.6) + uProgress * 0.9);
    float b = fbm(p * 3.1 - vec2(t * 0.7, t * 0.4) + 11.0);

    float field = a * 0.68 + b * 0.32;
    field = smoothstep(0.32, 0.92, field);

    // The reader's own light. Very low, and it is the only part of the
    // backdrop that moves at input speed rather than at ambient speed.
    float lamp = exp(-length((p - uPointer * vec2(0.5 * uAspect, 0.5))) * 2.1);

    // A band that tracks position in the document, so the backdrop is
    // not the same picture at the top and at the bottom.
    float band = exp(-pow((uv.y - (1.0 - uProgress)) * 2.4, 2.0));

    vec3 c = uTint * field * (0.55 + band * 0.55);
    c += uAccent * lamp * (0.05 + uEnergy * 0.07);
    c += uTint * band * 0.12;

    // Vignette. Keeps the corners from competing with the rail and the
    // masthead, both of which live there.
    float vig = 1.0 - smoothstep(0.55, 1.15, length(p));

    float alpha = (field * 0.5 + band * 0.22 + lamp * 0.3) * vig;
    alpha *= uOpacity * (0.82 + uIdle * 0.18);

    gl_FragColor = vec4(c, clamp(alpha, 0.0, 1.0));
  }
`;

/* ------------------------------------------------------------------ */
/* boundary                                                            */
/* ------------------------------------------------------------------ */

/**
 * The gate. A membrane rather than a wall: it has to read as something
 * traffic passes *through* and is changed by, because that is what the
 * stage it marks actually does.
 */
export const boundaryVertex = /* glsl */ `
  varying vec2 vUvPlane;

  void main() {
    vUvPlane = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const boundaryFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;

  varying vec2 vUvPlane;

  void main() {
    vec2 uv = vUvPlane;

    // A fine grid, and a sweep crossing it.
    vec2 g = abs(fract(uv * vec2(34.0, 17.0)) - 0.5);
    float grid = 1.0 - smoothstep(0.0, 0.06, min(g.x, g.y));

    float sweep = exp(-pow((uv.x - fract(uTime * 0.13)) * 9.0, 2.0));

    // Fade to nothing at the edges so the plane has no visible border.
    float edge =
      smoothstep(0.0, 0.16, uv.x) * smoothstep(1.0, 0.84, uv.x) *
      smoothstep(0.0, 0.14, uv.y) * smoothstep(1.0, 0.86, uv.y);

    float a = (0.06 + grid * 0.26 + sweep * 0.45) * edge * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor * (0.45 + sweep * 0.9), a);
  }
`;
