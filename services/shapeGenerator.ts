import * as THREE from 'three';
import { ShapeType } from '../types';

// Helper to get random point in sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi)
  };
};

export const generateShapePositions = (type: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  const p = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    switch (type) {
      case ShapeType.HEART: {
        // Parametric Heart
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        // Spread points more evenly
        const t = phi;
        // x = 16sin^3(t)
        // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        // Add some Z depth
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const z = (Math.random() - 0.5) * 5; 
        
        // Scale down
        p.set(x, y, z).multiplyScalar(0.3);
        
        // Add random noise to fill volume
        p.x += (Math.random() - 0.5) * 1;
        p.y += (Math.random() - 0.5) * 1;
        p.z += (Math.random() - 0.5) * 4;
        break;
      }

      case ShapeType.FLOWER: {
        // Rose/Flower parametric
        const k = 5; // petals
        const theta = Math.random() * Math.PI * 2;
        const r = Math.cos(k * theta) * 5 + 2; // radius variation
        const zDepth = (Math.random() - 0.5) * 2;
        
        p.set(
          r * Math.cos(theta),
          r * Math.sin(theta),
          zDepth + Math.sin(r) // Curving petals
        ).multiplyScalar(1.0);
        break;
      }

      case ShapeType.SATURN: {
        const isRing = Math.random() > 0.4;
        if (isRing) {
          // Ring
          const angle = Math.random() * Math.PI * 2;
          const dist = 6 + Math.random() * 4;
          p.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 0.5, Math.sin(angle) * dist);
          // Tilt the ring
          p.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.4);
          p.applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.2);
        } else {
          // Planet Body
          const coords = randomInSphere(3.5);
          p.set(coords.x, coords.y, coords.z);
        }
        break;
      }

      case ShapeType.MEDITATE: {
        // Approximate a sitting figure with spheres/cylinders
        const r = Math.random();
        
        if (r < 0.25) {
          // Head
          const coords = randomInSphere(1.2);
          p.set(coords.x, coords.y + 3.5, coords.z);
        } else if (r < 0.6) {
          // Body (Cylinder-ish)
          const angle = Math.random() * Math.PI * 2;
          const rad = 1.5 + Math.random() * 1;
          const h = (Math.random() - 0.5) * 3.5;
          p.set(Math.cos(angle) * rad, h + 1, Math.sin(angle) * rad);
        } else {
          // Legs/Base (Wide oval)
          const angle = Math.random() * Math.PI * 2;
          const rad = 3 + Math.random() * 1.5;
          const h = (Math.random() - 0.5) * 1;
          p.set(Math.cos(angle) * rad, h - 2, Math.sin(angle) * rad * 0.7);
        }
        break;
      }

      case ShapeType.FIREWORKS: {
        const coords = randomInSphere(0.5); // Start small, expands in animation
        p.set(coords.x, coords.y, coords.z);
        break;
      }

      default:
        p.set(0, 0, 0);
    }

    positions[i3] = p.x;
    positions[i3 + 1] = p.y;
    positions[i3 + 2] = p.z;
  }

  return positions;
};
