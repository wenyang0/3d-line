import * as THREE from 'three';

export enum ShapeType {
  HEART = 'heart',
  FLOWER = 'flower',
  SATURN = 'saturn',
  MEDITATE = 'meditate', // Approximating Buddha
  FIREWORKS = 'fireworks',
}

export interface HandData {
  leftHand: THREE.Vector3 | null;
  rightHand: THREE.Vector3 | null;
  distance: number; // 0 to 1 normalized
  isDetecting: boolean;
  gesture: 'none' | 'open' | 'closed';
}

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
  shape: ShapeType;
}
