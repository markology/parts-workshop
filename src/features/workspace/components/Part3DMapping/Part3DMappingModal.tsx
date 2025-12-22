"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { X, Save, Upload, RotateCcw, RotateCw, ZoomIn, ZoomOut, Palette } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as THREE from "three";

interface PaintPoint {
  id: string;
  position: THREE.Vector3;
  color: string;
  partName: string;
}

interface Part3DMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  partId: string;
  currentImage?: string;
  onSave: (imageData: string, paintPoints: PaintPoint[]) => void;
}

const PRESET_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", 
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
];

// 3D Human Body Component
function HumanBody({ 
  selectedColor, 
  brushSize, 
  onBodyPaint,
  isPainting,
  onStartPainting
}: {
  selectedColor: string;
  brushSize: number;
  onBodyPaint: (point: THREE.Vector3, partName: string) => void;
  isPainting: boolean;
  onStartPainting: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    onStartPainting();
    if (isPainting) {
      const point = event.point.clone();
      if (groupRef.current) {
        groupRef.current.worldToLocal(point);
      }
      const partName = event.object.userData?.name || 'body';
      onBodyPaint(point, partName);
    }
  };

  const handlePointerMove = (event: any) => {
    if (isPainting && event.buttons === 1) {
      const point = event.point.clone();
      if (groupRef.current) {
        groupRef.current.worldToLocal(point);
      }
      const partName = event.object.userData?.name || 'body';
      onBodyPaint(point, partName);
    }
  };

  return (
    <group ref={groupRef}>
      {/* Head */}
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

      {/* Torso */}
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

      {/* Left Arm */}
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

      {/* Right Arm */}
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

      {/* Left Leg */}
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

      {/* Right Leg */}
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
    </group>
  );
}

// Scene component
function Scene({ 
  paintPoints, 
  selectedColor, 
  brushSize, 
  onBodyPaint,
  onStartPainting,
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
  onStartPainting: () => void;
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
          selectedColor={selectedColor}
          brushSize={brushSize}
          onBodyPaint={onBodyPaint}
          onStartPainting={onStartPainting}
          isPainting={isPainting}
        />
        {/* Render paint points as overlapping spheres */}
        {paintPoints.map((point) => (
          <mesh key={point.id} position={point.position}>
            <sphereGeometry args={[brushSize * 1.5, 6, 6]} />
            <meshBasicMaterial color={point.color} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      {/* Only enable OrbitControls when not painting */}
      {!isPainting && (
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0.5, 0]}
          maxDistance={15}
          minDistance={1}
        />
      )}
    </>
  );
}

export default function Part3DMappingModal({
  isOpen,
  onClose,
  partName,
  partId,
  currentImage,
  onSave
}: Part3DMappingModalProps) {
  const [selectedColor, setSelectedColor] = useState("#FF6B6B");
  const [paintPoints, setPaintPoints] = useState<PaintPoint[]>([]);
  const [brushSize, setBrushSize] = useState(0.05);
  const [isPainting, setIsPainting] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.5);
  const [uploadedImage, setUploadedImage] = useState<string | null>(currentImage || null);

  const handleBodyPaint = useCallback((point: THREE.Vector3, partName: string) => {
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
    }
  }, [selectedColor, paintPoints, brushSize]);

  const handleStartPainting = useCallback(() => {
    // Reset for new stroke
  }, []);

  const handleClearAll = () => {
    setPaintPoints([]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Generate thumbnail from 3D scene or use uploaded image
    const imageData = uploadedImage || generateThumbnail();
    onSave(imageData, paintPoints);
    onClose();
  };

  const generateThumbnail = () => {
    // This would generate a thumbnail from the 3D scene
    // For now, return a placeholder
    return "data:image/svg+xml;base64," + btoa(`
      <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" fill="#f0f0f0"/>
        <text x="100" y="150" text-anchor="middle" fill="#666">3D Body Map</text>
      </svg>
    `);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">3D Body Mapping</h2>
            <p className="text-gray-400">Create a visual representation for: {partName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-80 bg-gray-800/50 p-6 border-r border-gray-700 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-white">Controls</h3>
            
            {/* Image Upload */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2 text-gray-300">Custom Image</h4>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </label>
                {uploadedImage && (
                  <div className="mt-2">
                    <img 
                      src={uploadedImage} 
                      alt="Custom part image" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Color Picker */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2 text-gray-300">Paint Color</h4>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      selectedColor === color
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-600 cursor-pointer"
              />
            </div>

            {/* Brush Size */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2 text-gray-300">Brush Size: {brushSize.toFixed(2)}</h4>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={brushSize}
                onChange={(e) => setBrushSize(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Painting Mode Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setIsPainting(!isPainting)}
                className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isPainting 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>{isPainting ? 'Painting Mode' : 'Rotate Mode'}</span>
              </button>
            </div>

            {/* Manual Controls */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2 text-gray-300">Manual Controls</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
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
              </div>
              <div className="grid grid-cols-2 gap-2">
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

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleClearAll}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear All</span>
              </button>
              <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Body Map</span>
              </button>
            </div>
          </div>

          {/* Right Panel - 3D Canvas */}
          <div className="flex-1 bg-gray-900 relative">
            <Suspense
              fallback={
                <div className="h-full w-full flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                  <LoadingSpinner variant="sparkles" size="lg" message="Loading 3D scene..." />
                </div>
              }
            >
              <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                <Scene 
                  paintPoints={paintPoints}
                  selectedColor={selectedColor}
                  brushSize={brushSize}
                  onBodyPaint={handleBodyPaint}
                  onStartPainting={handleStartPainting}
                  isPainting={isPainting}
                  rotation={rotation}
                  onRotationChange={setRotation}
                  zoom={zoom}
                  onZoomChange={setZoom}
                />
              </Canvas>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
