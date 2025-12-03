import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Particles from './components/Particles';
import HandTracker from './components/HandTracker';
import UIControls from './components/UIControls';
import { ShapeType, HandData } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.HEART);
  const [particleColor, setParticleColor] = useState<string>(COLORS.primary);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Refs for gesture logic
  const handDataRef = useRef<HandData>({
    leftHand: null,
    rightHand: null,
    distance: 0.5,
    isDetecting: false,
    gesture: 'none'
  });
  
  const gestureStateRef = useRef({
    closingStartTime: 0,
    isClosing: false,
    lastCountdownValue: -1
  });

  const handleHandUpdate = useCallback((data: HandData) => {
    handDataRef.current = data;
    
    // Update detection state
    if (data.isDetecting !== isHandDetected) {
      setIsHandDetected(data.isDetecting);
    }

    // Gesture Logic: "Charging" / Countdown
    // If hands are very close (closed) for 3 seconds, trigger Fireworks
    const isHandsClosed = data.isDetecting && data.distance < 0.2;
    const now = Date.now();
    const state = gestureStateRef.current;

    if (isHandsClosed) {
      if (!state.isClosing) {
        state.isClosing = true;
        state.closingStartTime = now;
      } else {
        const elapsed = now - state.closingStartTime;
        const totalDuration = 3000;
        const remaining = Math.ceil((totalDuration - elapsed) / 1000);

        if (remaining <= 0) {
           // Trigger Effect
           if (currentShape !== ShapeType.FIREWORKS) {
             setCurrentShape(ShapeType.FIREWORKS);
             setParticleColor(COLORS.secondary);
           }
           state.isClosing = false; // Reset
           state.closingStartTime = 0;
           setCountdown(null);
        } else if (remaining <= 3) {
          // Update countdown display if changed
          if (state.lastCountdownValue !== remaining) {
            setCountdown(remaining);
            state.lastCountdownValue = remaining;
          }
        }
      }
    } else {
      // Reset if hands open
      if (state.isClosing) {
        state.isClosing = false;
        state.closingStartTime = 0;
        state.lastCountdownValue = -1;
        setCountdown(null);
      }
    }

  }, [isHandDetected, currentShape]);

  return (
    <div className="w-full h-screen bg-neutral-900 relative overflow-hidden">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
          <color attach="background" args={['#050505']} />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          {/* Environment */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {/* Main Content */}
          <Particles 
            shape={currentShape} 
            color={particleColor} 
            handDataRef={handDataRef} 
          />
          
          {/* Camera Controls */}
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate={!isHandDetected} 
            autoRotateSpeed={0.5}
            minDistance={5}
            maxDistance={50}
          />
        </Canvas>
      </div>

      {/* Components Layer */}
      <HandTracker onHandUpdate={handleHandUpdate} showPreview={true} />
      
      <UIControls 
        currentShape={currentShape}
        onShapeChange={setCurrentShape}
        color={particleColor}
        onColorChange={setParticleColor}
        handDetected={isHandDetected}
        countdown={countdown}
      />

    </div>
  );
};

export default App;