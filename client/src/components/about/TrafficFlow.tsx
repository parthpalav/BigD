import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TrafficFlowProps {
  intensity: number;
  focusMode: 'commercial' | 'private' | 'intelligence' | 'default';
}

export const TrafficFlow: React.FC<TrafficFlowProps> = ({ intensity, focusMode }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  // Generate traffic particles
  const particleData = useMemo(() => {
    const count = Math.floor(300 * intensity);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const gridSize = 16;
    const spacing = 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random position along roads
      const isHorizontal = Math.random() > 0.5;
      if (isHorizontal) {
        positions[i3] = (Math.random() - 0.5) * gridSize * spacing;
        positions[i3 + 1] = 0.1;
        positions[i3 + 2] = Math.floor((Math.random() - 0.5) * gridSize) * spacing;
        velocities[i3] = (Math.random() - 0.5) * 0.02;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = 0;
      } else {
        positions[i3] = Math.floor((Math.random() - 0.5) * gridSize) * spacing;
        positions[i3 + 1] = 0.1;
        positions[i3 + 2] = (Math.random() - 0.5) * gridSize * spacing;
        velocities[i3] = 0;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      }

      // Color based on mode
      let color = new THREE.Color();
      if (focusMode === 'commercial') {
        color = new THREE.Color('#fbbf24'); // Amber
      } else if (focusMode === 'private') {
        color = new THREE.Color('#3b82f6'); // Blue
      } else if (focusMode === 'intelligence') {
        color = new THREE.Color('#a855f7'); // Purple
      } else {
        color = new THREE.Color('#10b981'); // Green
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.05 + 0.03;
    }

    velocitiesRef.current = velocities;

    return { positions, colors, sizes, count };
  }, [intensity, focusMode]);

  // Animate particles
  useFrame(() => {
    if (particlesRef.current && velocitiesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = velocitiesRef.current;

      for (let i = 0; i < particleData.count; i++) {
        const i3 = i * 3;

        positions[i3] += velocities[i3];
        positions[i3 + 2] += velocities[i3 + 2];

        // Wrap around
        const gridSize = 16;
        if (Math.abs(positions[i3]) > gridSize) positions[i3] *= -1;
        if (Math.abs(positions[i3 + 2]) > gridSize) positions[i3 + 2] *= -1;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleData.count}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleData.count}
          array={particleData.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleData.count}
          array={particleData.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
