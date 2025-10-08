"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Palette, Save, RotateCcw, Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Box } from "@react-three/drei";
import * as THREE from "three";

interface PaintPoint {
  id: string;
  position: THREE.Vector3;
  color: string;
  partName: string;
}

const PRESET_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
  "#F7DC6F", // Gold
  "#BB8FCE", // Lavender
];

// Simple 3D Human Body Component with surface-attached painting
function HumanBody({ 
  paintPoints, 
  selectedColor, 
  brushSize, 
  onBodyPaint,
  isPainting
}: {
  paintPoints: PaintPoint[];
  selectedColor: string;
  brushSize: number;
  onBodyPaint: (point: THREE.Vector3, partName: string) => void;
  isPainting: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    console.log('Pointer down event:', event);
    if (isPainting) {
      const partName = event.object.userData?.name || 'body';
      // Get the point in world space, then transform it to local space
      const point = event.point.clone();
      
      // Transform the point to account for the body's transformations
      if (groupRef.current) {
        groupRef.current.worldToLocal(point);
      }
      
      console.log('Painting at point:', point, 'on part:', partName);
      onBodyPaint(point, partName);
    } else {
      console.log('Not in painting mode');
    }
  };

  const handlePointerMove = (event: any) => {
    if (isPainting && event.buttons === 1) {
      const partName = event.object.userData?.name || 'body';
      const point = event.point.clone();
      
      // Transform the point to account for the body's transformations
      if (groupRef.current) {
        groupRef.current.worldToLocal(point);
      }
      
      onBodyPaint(point, partName);
    }
  };

  return (
    <group ref={groupRef}>
      {/* Human body parts */}
      <mesh 
        position={[0, 1.5, 0]} 
        userData={{ name: 'head' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setHoveredPart('head')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={hoveredPart === 'head' ? "#ff6b6b" : "#f5f5f5"} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      <mesh 
        position={[0, 0.5, 0]} 
        userData={{ name: 'torso' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setHoveredPart('torso')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.3, 0.4, 1.0, 12]} />
        <meshStandardMaterial 
          color={hoveredPart === 'torso' ? "#ff6b6b" : "#f5f5f5"} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      <mesh 
        position={[-0.5, 0.5, 0]} 
        rotation={[0, 0, Math.PI / 4]}
        userData={{ name: 'leftArm' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setHoveredPart('leftArm')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.08, 0.1, 0.8, 8]} />
        <meshStandardMaterial 
          color={hoveredPart === 'leftArm' ? "#ff6b6b" : "#f5f5f5"} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      <mesh 
        position={[0.5, 0.5, 0]} 
        rotation={[0, 0, -Math.PI / 4]}
        userData={{ name: 'rightArm' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setHoveredPart('rightArm')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.08, 0.1, 0.8, 8]} />
        <meshStandardMaterial 
          color={hoveredPart === 'rightArm' ? "#ff6b6b" : "#f5f5f5"} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      <mesh 
        position={[-0.2, -0.5, 0]} 
        userData={{ name: 'leftLeg' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setHoveredPart('leftLeg')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.1, 0.12, 1.0, 8]} />
        <meshStandardMaterial 
          color={hoveredPart === 'leftLeg' ? "#ff6b6b" : "#f5f5f5"} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      <mesh 
        position={[0.2, -0.5, 0]} 
        userData={{ name: 'rightLeg' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setHoveredPart('rightLeg')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.1, 0.12, 1.0, 8]} />
        <meshStandardMaterial 
          color={hoveredPart === 'rightLeg' ? "#ff6b6b" : "#f5f5f5"} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      {/* Render paint points as overlapping spheres for smooth appearance */}
      {paintPoints.map((point) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[brushSize * 1.5, 8, 8]} />
          <meshBasicMaterial 
            color={point.color} 
            transparent 
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// Scene component with manual rotation controls
function Scene({ 
  paintPoints, 
  selectedColor, 
  brushSize, 
  onBodyPaint,
  isPainting,
  rotation,
  onRotationChange,
  zoom,
  onZoomChange
}: {
  paintPoints: PaintPoint[];
  selectedColor: string;
  brushSize: number;
  onBodyPaint: (point: THREE.Vector3, partName: string) => void;
  isPainting: boolean;
  rotation: { x: number; y: number };
  onRotationChange: (rotation: { x: number; y: number }) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <group 
        ref={groupRef}
        rotation={[rotation.x * Math.PI / 180, rotation.y * Math.PI / 180, 0]}
        scale={[zoom, zoom, zoom]}
      >
        <HumanBody 
          paintPoints={paintPoints}
          selectedColor={selectedColor}
          brushSize={brushSize}
          onBodyPaint={onBodyPaint}
          isPainting={isPainting}
        />
      </group>
      {/* Only enable OrbitControls when not painting */}
      {!isPainting && (
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          onChange={() => {
            if (groupRef.current) {
              const euler = new THREE.Euler();
              euler.setFromQuaternion(groupRef.current.quaternion);
              onRotationChange({
                x: euler.x * 180 / Math.PI,
                y: euler.y * 180 / Math.PI
              });
            }
          }}
        />
      )}
    </>
  );
}

export default function Body3DMappingPage() {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState("#FF6B6B");
  const [paintPoints, setPaintPoints] = useState<PaintPoint[]>([]);
  const [brushSize, setBrushSize] = useState(0.05);
  const [isPainting, setIsPainting] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.5);

  // Smooth painting system with overlapping and continuous strokes
  const handleBodyPaint = useCallback((point: THREE.Vector3, partName: string) => {
    console.log('Adding paint point:', point, 'to part:', partName);
    
    // Always add the point for smooth continuous painting
    // Only check distance for very close points to avoid excessive density
    const veryClosePoints = paintPoints.filter(p => 
      p.position.distanceTo(point) < brushSize * 0.5
    );
    
    if (veryClosePoints.length === 0) {
      const newPoint: PaintPoint = {
        id: `paint-${Date.now()}-${Math.random()}`,
        position: point.clone(),
        color: selectedColor,
        partName: partName
      };
      
      setPaintPoints(prev => [...prev, newPoint]);
      console.log('Added paint point:', newPoint);
    }
  }, [selectedColor, paintPoints, brushSize]);

  const handleClearAll = () => {
    setPaintPoints([]);
  };

  const handleSaveBodyMap = () => {
    console.log('Saving 3D body map:', paintPoints);
    router.push('/workspace/maps');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">3D Body Mapping</h1>
                <p className="text-sm text-gray-400">Click on the 3D body to create part avatars</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Painting Mode Toggle */}
            <button
              onClick={() => setIsPainting(!isPainting)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isPainting 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>{isPainting ? 'Painting Mode' : 'Rotate Mode'}</span>
            </button>
            
            {/* Manual Rotation Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRotation(prev => ({ ...prev, y: prev.y - 15 }))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Rotate Left"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation(prev => ({ ...prev, y: prev.y + 15 }))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Rotate Right"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation(prev => ({ ...prev, x: prev.x - 15 }))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Rotate Up"
              >
                <RotateCw className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={() => setRotation(prev => ({ ...prev, x: prev.x + 15 }))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Rotate Down"
              >
                <RotateCw className="w-4 h-4 -rotate-90" />
              </button>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.5, 5))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.5, 0.5))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main 3D Canvas */}
        <div className="flex-1 relative">
          <Suspense fallback={
            <div className="h-full w-full bg-gray-700 flex items-center justify-center">
              <div className="text-gray-400">Loading 3D scene...</div>
            </div>
          }>
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
              <Scene 
                paintPoints={paintPoints}
                selectedColor={selectedColor}
                brushSize={brushSize}
                onBodyPaint={handleBodyPaint}
                isPainting={isPainting}
                rotation={rotation}
                onRotationChange={setRotation}
                zoom={zoom}
                onZoomChange={setZoom}
              />
            </Canvas>
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-900/50 backdrop-blur-sm border-l border-gray-800 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Color Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Paint Colors</h3>
              <div className="space-y-4">
                {/* Current Color Display */}
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded border border-gray-600"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-sm text-gray-400">{selectedColor}</span>
                </div>
                
                {/* Preset Colors */}
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        selectedColor === color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-gray-600 hover:border-gray-400 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                {/* Custom Color Picker */}
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-400">{selectedColor}</span>
                </div>
              </div>
            </div>

            {/* Brush Size */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Brush Size</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.02"
                  max="0.2"
                  step="0.01"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-400 text-center">
                  {brushSize.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear All</span>
              </button>
              
              <button
                onClick={handleSaveBodyMap}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Body Map</span>
              </button>
            </div>

            {/* Paint Points Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Paint Info</h3>
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">
                  Paint Points: {paintPoints.length}
                </p>
                <p className="text-sm text-gray-400">
                  Click and drag on the 3D body to paint. Each body part can be painted separately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}