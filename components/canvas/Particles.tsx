"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Soft round sprite so points read as glow, not squares. */
function useDotTexture() {
  return useMemo(() => {
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(200,220,255,0.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

export function Particles({ count = 520 }: { count?: number }) {
  const group = useRef<THREE.Points>(null);
  const texture = useDotTexture();
  const { viewport } = useThree();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.02;
    group.current.rotation.x += delta * 0.006;
    // gentle parallax toward the pointer
    const targetX = state.pointer.x * 0.3;
    const targetY = state.pointer.y * 0.2;
    group.current.position.x += (targetX - group.current.position.x) * 0.03;
    group.current.position.y += (targetY - group.current.position.y) * 0.03;
  });

  return (
    <points ref={group} scale={Math.min(1.4, viewport.width / 6)}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.05}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.7}
        color={new THREE.Color("#9ec1ff")}
      />
    </points>
  );
}
