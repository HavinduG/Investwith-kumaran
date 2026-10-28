"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sparkles } from "@react-three/drei"

import type { Theme } from "@/components/theme/theme-script"

/* -------------------------------------------------------------------------- */
/*                                   Palette                                  */
/* -------------------------------------------------------------------------- */

const PALETTES = {
  dark: {
    base: "#0b1a17",
    top: "#1a3d36",
    window: "#f4d08a",
    edge: "#d9b56f",
    fog: "#0a1613",
    line: "#d9b56f",
    sparkle: "#e9c987",
    windowMix: 0.95,
    edgeMix: 0.9,
    lineStrength: 1,
  },
  light: {
    base: "#cfc4ae",
    top: "#fdfaf3",
    window: "#b98f45",
    edge: "#b0873f",
    fog: "#f7f3ea",
    line: "#b0873f",
    sparkle: "#b98f45",
    windowMix: 0.55,
    edgeMix: 0.75,
    lineStrength: 0.7,
  },
} as const

/* -------------------------------------------------------------------------- */
/*                                   Shaders                                  */
/* -------------------------------------------------------------------------- */

const towerVertex = /* glsl */ `
  attribute vec3 aOffset; // x, z, rise delay
  attribute vec3 aSize;   // width, height, depth
  attribute float aSeed;

  uniform float uRise;

  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vRise;
  varying float vDepth;

  void main() {
    float r = smoothstep(aOffset.z, aOffset.z + 0.65, uRise);
    r = 1.0 - pow(1.0 - r, 3.0);

    vec3 p = position;
    vec3 world = vec3(p.x * aSize.x, p.y * aSize.y * max(r, 0.0001), p.z * aSize.z)
      + vec3(aOffset.x, 0.0, aOffset.y);

    vLocal = p;
    vSize = aSize;
    vNormal = normal;
    vSeed = aSeed;
    vRise = r;

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const towerFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uTop;
  uniform vec3 uWindow;
  uniform vec3 uEdge;
  uniform vec3 uFog;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uTime;
  uniform float uWindowMix;
  uniform float uEdgeMix;

  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vRise;
  varying float vDepth;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 n = normalize(vNormal);
    float h = vLocal.y;
    vec3 col = mix(uBase, uTop, pow(h, 1.3));

    float light = 0.6 + 0.4 * max(dot(n, normalize(vec3(0.5, 0.9, 0.6))), 0.0);
    col *= light;

    // Windows on the side faces
    if (abs(n.y) < 0.5) {
      vec2 face = abs(n.x) > 0.5
        ? vec2(vLocal.z * vSize.z, vLocal.y * vSize.y * vRise)
        : vec2(vLocal.x * vSize.x, vLocal.y * vSize.y * vRise);
      vec2 cell = face * vec2(2.4, 2.8);
      vec2 id = floor(cell);
      vec2 f = fract(cell);
      float win = step(0.28, f.x) * step(f.x, 0.72) * step(0.3, f.y) * step(f.y, 0.72);
      float lit = step(0.58, hash(id + vSeed * 31.0));
      float flicker = 0.7 + 0.3 * sin(uTime * (0.8 + hash(id) * 1.6) + hash(id + 3.0) * 6.28);
      col = mix(col, uWindow, win * lit * flicker * uWindowMix);
    }

    // Glowing edges: second-smallest distance to the box faces
    float dx = (0.5 - abs(vLocal.x)) * vSize.x;
    float dz = (0.5 - abs(vLocal.z)) * vSize.z;
    float dt = (1.0 - vLocal.y) * vSize.y * vRise;
    float a = min(dx, min(dz, dt));
    float c = max(dx, max(dz, dt));
    float b = dx + dz + dt - a - c;
    float aa = max(fwidth(b), 0.0001);
    float edge = 1.0 - smoothstep(0.015, 0.015 + aa * 1.5 + 0.03, b);
    col = mix(col, uEdge, edge * uEdgeMix * (0.35 + 0.65 * h));

    // Golden crown light on rooftops
    col += uEdge * smoothstep(0.9, 1.0, h) * 0.12;

    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    gl_FragColor = vec4(mix(col, uFog, fog), 1.0);
  }
`

const groundVertex = /* glsl */ `
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const groundFragment = /* glsl */ `
  uniform vec3 uFog;
  uniform vec3 uLine;
  uniform float uTime;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uStrength;

  varying vec3 vWorld;
  varying float vDepth;

  float grid(vec2 p, float size) {
    vec2 c = p / size;
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }

  void main() {
    float lines = grid(vWorld.xz, 2.3) * 0.28;
    float avenue = exp(-abs(vWorld.x) * 1.4);
    float pulse = pow(0.5 + 0.5 * sin(vWorld.z * 0.32 - uTime * 2.2), 8.0);

    vec3 col = uFog;
    col = mix(col, uLine, lines * uStrength);
    col = mix(col, uLine, avenue * (0.14 + pulse * 0.55) * uStrength);

    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    gl_FragColor = vec4(mix(col, uFog, fog), 1.0);
  }
`

/* -------------------------------------------------------------------------- */
/*                                City generator                              */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createCity(compact: boolean) {
  const rand = mulberry32(2022)
  const cols = compact ? 8 : 14
  const rows = compact ? 15 : 22
  const spacing = 2.3
  const offsets: number[] = []
  const sizes: number[] = []
  const seeds: number[] = []

  for (let row = 0; row < rows; row++) {
    for (let c = -cols; c <= cols; c++) {
      // c === 0 is the central avenue the camera flies along
      if (c === 0 || rand() < 0.14) continue

      const x = c * spacing + Math.sign(c) * 0.6 + (rand() - 0.5) * 0.5
      const z = 6 - row * 2.5 + (rand() - 0.5) * 0.6
      const depth = row / rows
      const centrality = 1 - Math.min(Math.abs(x) / (cols * spacing), 1)
      const height =
        0.8 + depth * 2 + Math.pow(rand(), 2.2) * (4 + depth * 10 + centrality * 7)
      const delay = (Math.abs(c) / cols) * 0.45 + depth * 0.55 + rand() * 0.15

      offsets.push(x, z, delay)
      sizes.push(0.9 + rand(), height, 0.9 + rand())
      seeds.push(rand())
    }
  }

  return {
    count: seeds.length,
    offsets: new Float32Array(offsets),
    sizes: new Float32Array(sizes),
    seeds: new Float32Array(seeds),
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Scene parts                                */
/* -------------------------------------------------------------------------- */

type SceneProps = {
  theme: Theme
  progress: React.RefObject<number>
  pointer: React.RefObject<{ x: number; y: number }>
  reduceMotion: boolean
  compact: boolean
}

const FOG_NEAR = 16
const FOG_FAR = 78

function createUniforms(theme: Theme) {
  const p = PALETTES[theme]
  return {
    uBase: { value: new THREE.Color(p.base) },
    uTop: { value: new THREE.Color(p.top) },
    uWindow: { value: new THREE.Color(p.window) },
    uEdge: { value: new THREE.Color(p.edge) },
    uFog: { value: new THREE.Color(p.fog) },
    uLine: { value: new THREE.Color(p.line) },
    uWindowMix: { value: p.windowMix as number },
    uEdgeMix: { value: p.edgeMix as number },
    uStrength: { value: p.lineStrength as number },
    uFogNear: { value: FOG_NEAR },
    uFogFar: { value: FOG_FAR },
    uTime: { value: 0 },
    uRise: { value: 0 },
  }
}

type Uniforms = ReturnType<typeof createUniforms>

const SCRATCH = new THREE.Color()

function City({ theme, reduceMotion, compact }: Omit<SceneProps, "progress" | "pointer">) {
  // One uniforms object shared by the towers and the ground; it is only
  // mutated through the material ref inside useFrame.
  const [uniforms] = useState(() => createUniforms(theme))
  const towerMaterial = useRef<THREE.ShaderMaterial>(null)
  const city = useMemo(() => createCity(compact), [compact])

  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)
    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(city.offsets, 3))
    g.setAttribute("aSize", new THREE.InstancedBufferAttribute(city.sizes, 3))
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(city.seeds, 1))
    return g
  }, [city])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, delta) => {
    if (!towerMaterial.current) return
    const u = towerMaterial.current.uniforms as unknown as Uniforms
    const t = state.clock.elapsedTime
    u.uTime.value = reduceMotion ? 0 : t
    u.uRise.value = reduceMotion ? 2 : Math.min(t * 0.62, 2)

    // Smoothly crossfade every color when the theme changes
    const p = PALETTES[theme]
    const k = 1 - Math.exp(-delta * 4)
    u.uBase.value.lerp(SCRATCH.set(p.base), k)
    u.uTop.value.lerp(SCRATCH.set(p.top), k)
    u.uWindow.value.lerp(SCRATCH.set(p.window), k)
    u.uEdge.value.lerp(SCRATCH.set(p.edge), k)
    u.uFog.value.lerp(SCRATCH.set(p.fog), k)
    u.uLine.value.lerp(SCRATCH.set(p.line), k)
    u.uWindowMix.value += (p.windowMix - u.uWindowMix.value) * k
    u.uEdgeMix.value += (p.edgeMix - u.uEdgeMix.value) * k
    u.uStrength.value += (p.lineStrength - u.uStrength.value) * k
  })

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -40]}>
        <planeGeometry args={[320, 320]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={groundVertex}
          fragmentShader={groundFragment}
        />
      </mesh>
      <instancedMesh args={[geometry, undefined, city.count]} frustumCulled={false}>
        <shaderMaterial
          ref={towerMaterial}
          uniforms={uniforms}
          vertexShader={towerVertex}
          fragmentShader={towerFragment}
        />
      </instancedMesh>
      <Landmark theme={theme} reduceMotion={reduceMotion} />
    </group>
  )
}

/** A tall tapered spire at the end of the avenue with a pulsing beacon. */
function Landmark({ theme, reduceMotion }: { theme: Theme; reduceMotion: boolean }) {
  const beacon = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)
  const palette = PALETTES[theme]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      const rise = reduceMotion ? 1 : Math.min(Math.max((t - 0.9) / 1.6, 0), 1)
      group.current.scale.y = Math.max(1 - Math.pow(1 - rise, 3), 0.0001)
    }
    if (beacon.current && !reduceMotion) {
      beacon.current.scale.setScalar(1 + Math.sin(t * 3) * 0.35)
    }
  })

  return (
    <group position={[0, 0, -54]}>
      <group ref={group}>
        <mesh position={[0, 14, 0]}>
          <cylinderGeometry args={[0.12, 1.7, 28, 6, 1]} />
          <meshBasicMaterial color={palette.base} fog />
        </mesh>
        <mesh position={[0, 14, 0]}>
          <cylinderGeometry args={[0.13, 1.72, 28, 6, 6]} />
          <meshBasicMaterial color={palette.edge} wireframe transparent opacity={0.55} fog />
        </mesh>
      </group>
      <mesh ref={beacon} position={[0, 28.4, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={palette.window} toneMapped={false} />
      </mesh>
    </group>
  )
}

function CameraRig({ progress, pointer, reduceMotion }: Omit<SceneProps, "theme" | "compact">) {
  const { camera, size } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  const smooth = useRef({ p: 0, x: 0, y: 0 })

  useFrame((state, delta) => {
    const s = smooth.current
    s.p = THREE.MathUtils.damp(s.p, progress.current ?? 0, 3.5, delta)
    s.x = THREE.MathUtils.damp(s.x, pointer.current?.x ?? 0, 2.5, delta)
    s.y = THREE.MathUtils.damp(s.y, pointer.current?.y ?? 0, 2.5, delta)

    // ease in-out so the dive accelerates through the middle of the scroll
    const p = s.p < 0.5 ? 4 * s.p ** 3 : 1 - (-2 * s.p + 2) ** 3 / 2
    const portrait = size.width < size.height
    const idle = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.9

    camera.position.set(
      idle * (1 - p) + s.x * 1.6 * (1 - p * 0.6),
      THREE.MathUtils.lerp(portrait ? 12 : 9.5, 2.3, p) + s.y * 0.7,
      THREE.MathUtils.lerp(portrait ? 36 : 28, -6, p)
    )
    look.set(s.x * 0.6, THREE.MathUtils.lerp(2.6, 6.5, p), THREE.MathUtils.lerp(-12, -60, p))
    camera.lookAt(look)
  })

  return null
}

/* -------------------------------------------------------------------------- */
/*                                    Canvas                                  */
/* -------------------------------------------------------------------------- */

export default function SkylineScene({
  theme,
  progress,
  pointer,
  reduceMotion,
}: Omit<SceneProps, "compact">) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [ready, setReady] = useState(false)
  const [compact] = useState(() => window.matchMedia("(max-width: 767px)").matches)

  // Stop rendering entirely when the hero is off screen
  useEffect(() => {
    const el = container.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={container}
      className="absolute inset-0 transition-opacity duration-[1.6s] ease-out"
      style={{ opacity: ready ? 1 : 0 }}
    >
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, compact ? 1.5 : 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 42, near: 0.1, far: 220, position: [0, 9.5, 28] }}
        onCreated={() => setReady(true)}
      >
        <fog attach="fog" args={[PALETTES[theme].fog, FOG_NEAR, FOG_FAR]} />
        <City theme={theme} reduceMotion={reduceMotion} compact={compact} />
        <Sparkles
          count={compact ? 60 : 140}
          scale={[60, 16, 70]}
          position={[0, 8, -24]}
          size={compact ? 2.5 : 3.2}
          speed={reduceMotion ? 0 : 0.35}
          opacity={theme === "dark" ? 0.75 : 0.5}
          color={PALETTES[theme].sparkle}
        />
        <CameraRig progress={progress} pointer={pointer} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  )
}
