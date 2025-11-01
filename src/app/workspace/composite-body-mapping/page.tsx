"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Download, Share2 } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import PageLoader from "@/components/PageLoader";

interface PartMapping {
  partId: string;
  partName: string;
  image?: string;
  paintPoints: PaintPoint[];
  color: string;
}

interface PaintPoint {
  id: string;
  position: THREE.Vector3;
  color: string;
  partName: string;
}

// Composite 3D Body Component that shows all parts
function CompositeBody({ partMappings }: { partMappings: PartMapping[] }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {/* Base human body */}
      <mesh position={[0, 1.5, 0]} userData={{ name: 'head' }}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f5f5f5" transparent opacity={0.3} />
      </mesh>

      <mesh position={[0, 0.5, 0]} userData={{ name: 'torso' }}>
        <cylinderGeometry args={[0.3, 0.4, 1.0, 12]} />
        <meshStandardMaterial color="#f5f5f5" transparent opacity={0.3} />
      </mesh>

      <mesh position={[-0.5, 0.5, 0]} rotation={[0, 0, Math.PI / 4]} userData={{ name: 'leftArm' }}>
        <cylinderGeometry args={[0.08, 0.1, 0.8, 8]} />
        <meshStandardMaterial color="#f5f5f5" transparent opacity={0.3} />
      </mesh>

      <mesh position={[0.5, 0.5, 0]} rotation={[0, 0, -Math.PI / 4]} userData={{ name: 'rightArm' }}>
        <cylinderGeometry args={[0.08, 0.1, 0.8, 8]} />
        <meshStandardMaterial color="#f5f5f5" transparent opacity={0.3} />
      </mesh>

      <mesh position={[-0.2, -0.5, 0]} userData={{ name: 'leftLeg' }}>
        <cylinderGeometry args={[0.1, 0.12, 1.0, 8]} />
        <meshStandardMaterial color="#f5f5f5" transparent opacity={0.3} />
      </mesh>

      <mesh position={[0.2, -0.5, 0]} userData={{ name: 'rightLeg' }}>
        <cylinderGeometry args={[0.1, 0.12, 1.0, 8]} />
        <meshStandardMaterial color="#f5f5f5" transparent opacity={0.3} />
      </mesh>

      {/* Render all part mappings */}
      {partMappings.map((partMapping) => (
        <group key={partMapping.partId}>
          {partMapping.paintPoints.map((point) => (
            <mesh key={point.id} position={point.position}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshBasicMaterial 
                color={point.color} 
                transparent 
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// Scene component for composite view
function CompositeScene({ partMappings }: { partMappings: PartMapping[] }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <CompositeBody partMappings={partMappings} />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[0, 0.5, 0]}
        maxDistance={15}
        minDistance={1}
      />
    </>
  );
}

export default function CompositeBodyMappingPage() {
  const router = useRouter();
  const [partMappings, setPartMappings] = useState<PartMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all parts with their 3D mapping data
    const loadPartMappings = async () => {
      try {
        // This would fetch from the API in a real implementation
        // For now, we'll simulate loading from localStorage or the current map
        const maps = await fetch('/api/maps').then(res => res.json());
        if (maps.length > 0) {
          const currentMap = maps[0]; // Get the current map
          const parts = currentMap.nodes?.filter((node: any) => node.type === 'part') || [];
          
          const mappings: PartMapping[] = parts.map((part: any) => {
            // Parse 3D mapping data from scratchpad
            let paintPoints: PaintPoint[] = [];
            if (part.data.scratchpad) {
              try {
                const mappingMatch = part.data.scratchpad.match(/3D Mapping Data: (\[.*\])/);
                if (mappingMatch) {
                  paintPoints = JSON.parse(mappingMatch[1]);
                }
              } catch (e) {
                console.error('Failed to parse 3D mapping data:', e);
              }
            }

            return {
              partId: part.id,
              partName: part.data.label,
              image: part.data.image,
              paintPoints,
              color: `hsl(${Math.random() * 360}, 70%, 60%)` // Generate random color
            };
          });

          setPartMappings(mappings);
        }
      } catch (error) {
        console.error('Failed to load part mappings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPartMappings();
  }, []);

  const handleExport = () => {
    // Export composite body as image or data
    console.log('Exporting composite body mapping:', partMappings);
  };

  const handleShare = () => {
    // Share composite body mapping
    console.log('Sharing composite body mapping:', partMappings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-6 py-12">
        <PageLoader
          withBackground={false}
          fullHeight={false}
          className="max-w-xl"
          title="Loading composite body map"
          subtitle="We’re layering each part’s impressions and avatars onto the shared canvas."
          message="Preparing your composite view..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/workspaces")}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Composite Body Mapping</h1>
                <p className="text-sm text-gray-400">View all your parts together on one body</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Left Panel - Part List */}
        <div className="w-full lg:w-1/4 bg-gray-800/50 p-6 border-r border-gray-700 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Your Parts</h2>
          
          {partMappings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">No parts with 3D mappings yet</div>
              <p className="text-sm text-gray-500">
                Create parts and add 3D body mappings to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {partMappings.map((mapping) => (
                <div
                  key={mapping.partId}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: mapping.color }}
                    />
                    <h3 className="font-medium text-white">{mapping.partName}</h3>
                  </div>
                  <div className="text-sm text-gray-400">
                    {mapping.paintPoints.length} paint points
                  </div>
                  {mapping.image && (
                    <div className="mt-2">
                      <img 
                        src={mapping.image} 
                        alt={`${mapping.partName} thumbnail`}
                        className="w-full h-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - 3D Composite Canvas */}
        <div className="w-full lg:w-3/4 bg-gray-900 relative">
          <Suspense fallback={
            <div className="h-full w-full bg-gray-700 flex items-center justify-center">
              <div className="text-gray-400">Loading composite 3D scene...</div>
            </div>
          }>
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
              <CompositeScene partMappings={partMappings} />
            </Canvas>
          </Suspense>
          
          {/* Overlay Info */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Composite View</h3>
            <p className="text-sm text-gray-300">
              Showing {partMappings.length} parts with their individual 3D mappings combined
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
