import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CitySceneProps {
  scrollProgress: number;
  focusMode: 'commercial' | 'private' | 'intelligence' | 'default';
}

export const CityScene: React.FC<CitySceneProps> = ({ scrollProgress, focusMode }) => {
  const roadsRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Group>(null);

  // Generate road network
  const roads = useMemo(() => {
    const roadData = [];
    const gridSize = 8;
    const spacing = 2;

    // Horizontal roads
    for (let i = -gridSize; i <= gridSize; i++) {
      roadData.push({
        start: new THREE.Vector3(-gridSize * spacing, 0, i * spacing),
        end: new THREE.Vector3(gridSize * spacing, 0, i * spacing),
        type: Math.abs(i) % 3 === 0 ? 'major' : 'minor',
      });
    }

    // Vertical roads
    for (let i = -gridSize; i <= gridSize; i++) {
      roadData.push({
        start: new THREE.Vector3(i * spacing, 0, -gridSize * spacing),
        end: new THREE.Vector3(i * spacing, 0, gridSize * spacing),
        type: Math.abs(i) % 3 === 0 ? 'major' : 'minor',
      });
    }

    return roadData;
  }, []);

  // Generate intersection nodes
  const nodes = useMemo(() => {
    const nodeData = [];
    const gridSize = 8;
    const spacing = 2;

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        if (Math.abs(x) % 2 === 0 && Math.abs(z) % 2 === 0) {
          nodeData.push({
            position: new THREE.Vector3(x * spacing, 0, z * spacing),
            importance: Math.random() > 0.7 ? 'high' : 'normal',
          });
        }
      }
    }

    return nodeData;
  }, []);

  // Animate scene based on scroll
  useFrame((state) => {
    if (roadsRef.current) {
      roadsRef.current.rotation.y = scrollProgress * 0.5;
    }

    if (nodesRef.current) {
      nodesRef.current.children.forEach((node, i) => {
        const pulse = Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * 0.5 + 0.5;
        node.scale.setScalar(1 + pulse * 0.3);
      });
    }
  });

  // Color mapping based on mode
  const getColor = (type: string) => {
    if (focusMode === 'commercial') {
      return type === 'major' ? '#fbbf24' : '#f59e0b'; // Amber for commercial
    } else if (focusMode === 'private') {
      return type === 'major' ? '#3b82f6' : '#60a5fa'; // Blue for private
    } else if (focusMode === 'intelligence') {
      return type === 'major' ? '#a855f7' : '#c084fc'; // Purple for AI
    }
    return type === 'major' ? '#10b981' : '#34d399'; // Green default
  };

  return (
    <group>
      {/* Roads */}
      <group ref={roadsRef}>
        {roads.map((road, index) => {
          const points = [road.start, road.end];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);

          return (
            <primitive key={`road-${index}`} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
              color: getColor(road.type),
              linewidth: road.type === 'major' ? 3 : 1,
              opacity: 0.6 + scrollProgress * 0.4,
              transparent: true
            }))} />
          );
        })}
      </group>

      {/* Intersection Nodes */}
      <group ref={nodesRef}>
        {nodes.map((node, index) => (
          <mesh key={`node-${index}`} position={node.position}>
            <sphereGeometry args={[node.importance === 'high' ? 0.15 : 0.1, 16, 16]} />
            <meshBasicMaterial
              color={focusMode === 'intelligence' ? '#a855f7' : '#3b82f6'}
              transparent
              opacity={0.8}
            />
            <pointLight
              color={focusMode === 'intelligence' ? '#a855f7' : '#3b82f6'}
              intensity={node.importance === 'high' ? 2 : 1}
              distance={3}
            />
          </mesh>
        ))}
      </group>

      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <hemisphereLight intensity={0.4} groundColor="#1a1a1a" />
    </group>
  );
};
