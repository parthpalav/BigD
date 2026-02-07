import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SceneControllerProps {
  scrollProgress: number;
  focusMode: 'commercial' | 'private' | 'intelligence' | 'default';
}

export const SceneController: React.FC<SceneControllerProps> = ({ scrollProgress, focusMode }) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame(() => {
    // Calculate camera position based on scroll progress
    // Section 0 (0-0.2): Overview - high above
    // Section 1 (0.2-0.4): Commercial - focus on major roads
    // Section 2 (0.4-0.6): Private - zoom into neighborhoods
    // Section 3 (0.6-0.8): Intelligence - dramatic angle
    // Section 4 (0.8-1.0): Mission - pull back for grand view

    let targetX = 0;
    let targetY = 25;
    let targetZ = 25;
    let lookAtX = 0;
    let lookAtY = 0;
    let lookAtZ = 0;

    if (scrollProgress < 0.2) {
      // Section 0: Overview
      const t = scrollProgress / 0.2;
      targetY = 30 - t * 5;
      targetZ = 30 - t * 5;
    } else if (scrollProgress < 0.4) {
      // Section 1: Commercial - pan around
      const t = (scrollProgress - 0.2) / 0.2;
      targetX = Math.sin(t * Math.PI) * 15;
      targetY = 20;
      targetZ = 25 - t * 5;
      lookAtX = Math.sin(t * Math.PI) * 5;
    } else if (scrollProgress < 0.6) {
      // Section 2: Private - zoom in
      const t = (scrollProgress - 0.4) / 0.2;
      targetX = 15 - t * 10;
      targetY = 15 - t * 5;
      targetZ = 15 - t * 5;
      lookAtX = 5 - t * 5;
      lookAtZ = 5 - t * 5;
    } else if (scrollProgress < 0.8) {
      // Section 3: Intelligence - dramatic angle
      const t = (scrollProgress - 0.6) / 0.2;
      targetX = 5 + t * 10;
      targetY = 10 + t * 15;
      targetZ = 10 - t * 5;
      lookAtX = 0;
      lookAtY = 0;
      lookAtZ = 0;
    } else {
      // Section 4: Mission - grand finale
      const t = (scrollProgress - 0.8) / 0.2;
      targetX = 15 + t * 10;
      targetY = 25 + t * 10;
      targetZ = 5 + t * 25;
      lookAtY = -t * 5;
    }

    // Smooth interpolation
    targetPosition.current.set(targetX, targetY, targetZ);
    targetLookAt.current.set(lookAtX, lookAtY, lookAtZ);

    camera.position.lerp(targetPosition.current, 0.05);
    
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.normalize().multiplyScalar(10).add(camera.position);
    currentLookAt.lerp(targetLookAt.current, 0.05);
    camera.lookAt(currentLookAt);
  });

  return null;
};
