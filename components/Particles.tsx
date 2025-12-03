import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, HandData } from '../types';
import { generateShapePositions } from '../services/shapeGenerator';
import { PARTICLE_COUNT } from '../constants';

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  handDataRef: React.MutableRefObject<HandData>;
}

const Particles: React.FC<ParticlesProps> = ({ shape, color, handDataRef }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const [targetPositions, setTargetPositions] = useState<Float32Array>(() => generateShapePositions(ShapeType.HEART, PARTICLE_COUNT));
  
  // Current positions buffer
  const positions = useMemo(() => {
    return new Float32Array(PARTICLE_COUNT * 3);
  }, []);

  // Velocities for physics
  const velocities = useMemo(() => {
    return new Float32Array(PARTICLE_COUNT * 3).fill(0);
  }, []);

  // Generate new target positions when shape changes
  useEffect(() => {
    const newTargets = generateShapePositions(shape, PARTICLE_COUNT);
    setTargetPositions(newTargets);
  }, [shape]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const { distance, isDetecting, leftHand, rightHand } = handDataRef.current;
    
    // Safety check for large deltas
    const dt = Math.min(delta, 0.1);

    const positionsAttr = pointsRef.current.geometry.attributes.position;
    const currentPositions = positionsAttr.array as Float32Array;

    // Interaction Parameters
    const handInfluenceRadius = 4.0;
    const returnSpeed = 3.0;
    
    // Scale factor based on hand distance (Default 1.0 if no hands)
    // Map distance 0.0->1.0 to Scale 0.2->2.0
    let targetScale = isDetecting ? Math.max(0.2, distance * 2.5) : 1.0;
    
    // Special case for Fireworks: Expand continuously if detecting open hands
    if (shape === ShapeType.FIREWORKS && isDetecting && distance > 0.8) {
       targetScale = 3.0 + Math.sin(state.clock.elapsedTime * 2);
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // 1. Get Target Position (Morphing)
      let tx = targetPositions[i3] * targetScale;
      let ty = targetPositions[i3 + 1] * targetScale;
      let tz = targetPositions[i3 + 2] * targetScale;

      // 2. Add Hand Interaction (Repulsion/Attraction)
      // If hands are detected, particles react to them
      if (isDetecting) {
        const hands = [leftHand, rightHand].filter(h => h !== null) as THREE.Vector3[];
        
        hands.forEach(handPos => {
           const dx = currentPositions[i3] - handPos.x;
           const dy = currentPositions[i3 + 1] - handPos.y;
           const dz = currentPositions[i3 + 2] - handPos.z;
           const distSq = dx*dx + dy*dy + dz*dz;

           if (distSq < handInfluenceRadius * handInfluenceRadius) {
             const dist = Math.sqrt(distSq);
             const force = (handInfluenceRadius - dist) / handInfluenceRadius;
             
             // Push away gently to create a "force field" effect
             velocities[i3] += (dx / dist) * force * 10 * dt;
             velocities[i3 + 1] += (dy / dist) * force * 10 * dt;
             velocities[i3 + 2] += (dz / dist) * force * 10 * dt;
           }
        });
      }

      // 3. Physics Integration
      // Spring force towards target
      const px = currentPositions[i3];
      const py = currentPositions[i3 + 1];
      const pz = currentPositions[i3 + 2];

      velocities[i3] += (tx - px) * returnSpeed * dt;
      velocities[i3 + 1] += (ty - py) * returnSpeed * dt;
      velocities[i3 + 2] += (tz - pz) * returnSpeed * dt;

      // Damping
      velocities[i3] *= 0.92;
      velocities[i3 + 1] *= 0.92;
      velocities[i3 + 2] *= 0.92;

      // Update position
      currentPositions[i3] += velocities[i3] * dt;
      currentPositions[i3 + 1] += velocities[i3 + 1] * dt;
      currentPositions[i3 + 2] += velocities[i3 + 2] * dt;
    }

    positionsAttr.needsUpdate = true;
    
    // Rotate the whole system slowly
    pointsRef.current.rotation.y += dt * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;
