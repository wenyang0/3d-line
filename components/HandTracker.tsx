import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
  showPreview?: boolean;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate, showPreview = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });

        startCamera();
      } catch (err) {
        console.error("MediaPipe error:", err);
        setError("Could not load AI models.");
        setLoading(false);
      }
    };

    const startCamera = async () => {
      if (!videoRef.current) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          }
        });
        
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setLoading(false);
      } catch (err) {
        console.error("Camera error:", err);
        setError("Camera access denied.");
        setLoading(false);
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !handLandmarker) return;

      const nowInMs = Date.now();
      const results = handLandmarker.detectForVideo(videoRef.current, nowInMs);

      let leftHand: THREE.Vector3 | null = null;
      let rightHand: THREE.Vector3 | null = null;
      let distance = 0.5; // Default middle
      let isDetecting = false;

      if (results.landmarks && results.landmarks.length > 0) {
        isDetecting = true;

        // Process landmarks
        // MediaPipe coords: x, y (0-1), z. 
        // We map them roughly to 3D world space. 
        // In 3D world: X is left/right (-10 to 10), Y is up/down (-8 to 8)
        
        results.landmarks.forEach((landmarks, index) => {
            // Check handedness if available, otherwise guess based on x
            const isRight = results.handednesses[index][0].categoryName === 'Right';
            
            // Wrist is index 0
            const wrist = landmarks[0];
            const x = (wrist.x - 0.5) * -20; // Flip X for mirror effect
            const y = (wrist.y - 0.5) * -15; // Flip Y
            const z = 0; // Simplified Z

            const vec = new THREE.Vector3(x, y, z);

            if (isRight) rightHand = vec;
            else leftHand = vec;
        });

        // Calculate gesture/distance
        if (leftHand && rightHand) {
            // Distance between hands controls scale
            const dist = leftHand.distanceTo(rightHand);
            // Normalize roughly (0 to 15 range usually)
            distance = Math.min(Math.max(dist / 12, 0), 1.5);
        } else if (leftHand || rightHand) {
            // Single hand pinch check (Thumb tip vs Index tip)
            const landmarks = results.landmarks[0];
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const dx = thumbTip.x - indexTip.x;
            const dy = thumbTip.y - indexTip.y;
            const pinchDist = Math.sqrt(dx*dx + dy*dy);
            
            // Map pinch (0.02 closed, 0.2 open) to distance
            distance = Math.min(Math.max((pinchDist - 0.02) * 8, 0), 1);
        }
      }

      onHandUpdate({
        leftHand,
        rightHand,
        distance,
        isDetecting,
        gesture: 'none'
      });

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [onHandUpdate]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-500 ${showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black/50 backdrop-blur-sm w-40 h-32">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                Loading AI...
            </div>
        )}
        {error && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400 p-2 text-center">
                {error}
            </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
        <div className="absolute bottom-1 left-0 w-full text-[10px] text-center text-white/60 bg-black/40 py-0.5">
           Webcam Input
        </div>
      </div>
    </div>
  );
};

export default HandTracker;
