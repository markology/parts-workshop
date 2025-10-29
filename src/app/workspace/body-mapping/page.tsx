"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Palette, Save, RotateCcw, Download } from "lucide-react";

interface ColorSegment {
  id: string;
  color: string;
  name: string;
  pixels: { x: number; y: number }[];
}

interface BodyType {
  id: string;
  name: string;
  gender: string;
  outline: string; // SVG path data
}

const BODY_TYPES: BodyType[] = [
  {
    id: "female-curvy",
    name: "Curvy Female",
    gender: "Female",
    outline: "M200 40 C 175 40, 155 60, 155 90 C 155 120, 175 140, 200 140 C 225 140, 245 120, 245 90 C 245 60, 225 40, 200 40 Z M185 140 L 185 160 L 215 160 L 215 140 Z M160 160 L 160 200 C 160 220, 170 240, 190 250 C 190 280, 190 320, 200 320 C 210 320, 210 280, 210 250 C 230 240, 240 220, 240 200 L 240 160 Z M140 200 L 110 220 L 120 300 L 150 280 Z M260 200 L 290 220 L 280 300 L 250 280 Z M180 320 L 180 420 L 200 420 L 200 320 Z M200 320 L 200 420 L 220 420 L 220 320 Z"
  },
  {
    id: "female-athletic",
    name: "Athletic Female", 
    gender: "Female",
    outline: "M200 40 C 180 40, 165 55, 165 80 C 165 105, 180 120, 200 120 C 220 120, 235 105, 235 80 C 235 55, 220 40, 200 40 Z M185 120 L 185 140 L 215 140 L 215 120 Z M170 140 L 170 200 C 170 220, 180 240, 200 240 C 220 240, 230 220, 230 200 L 230 140 Z M150 180 L 120 200 L 130 280 L 160 260 Z M250 180 L 280 200 L 270 280 L 240 260 Z M185 240 L 185 340 L 200 340 L 200 240 Z M200 240 L 200 340 L 215 340 L 215 240 Z"
  },
  {
    id: "male-athletic",
    name: "Athletic Male",
    gender: "Male", 
    outline: "M200 40 C 180 40, 160 60, 160 90 C 160 120, 180 140, 200 140 C 220 140, 240 120, 240 90 C 240 60, 220 40, 200 40 Z M185 140 L 185 160 L 215 160 L 215 140 Z M160 160 L 160 200 C 160 220, 170 240, 190 250 C 190 280, 190 320, 200 320 C 210 320, 210 280, 210 250 C 230 240, 240 220, 240 200 L 240 160 Z M140 200 L 110 220 L 120 300 L 150 280 Z M260 200 L 290 220 L 280 300 L 250 280 Z M180 320 L 180 420 L 200 420 L 200 320 Z M200 320 L 200 420 L 220 420 L 220 320 Z"
  },
  {
    id: "male-average",
    name: "Average Male",
    gender: "Male",
    outline: "M200 40 C 180 40, 160 60, 160 90 C 160 120, 180 140, 200 140 C 220 140, 240 120, 240 90 C 240 60, 220 40, 200 40 Z M185 140 L 185 160 L 215 160 L 215 140 Z M170 160 L 170 200 C 170 220, 180 240, 200 240 C 220 240, 230 220, 230 200 L 230 160 Z M150 180 L 120 200 L 130 280 L 160 260 Z M250 180 L 280 200 L 270 280 L 240 260 Z M185 240 L 185 340 L 200 340 L 200 240 Z M200 240 L 200 340 L 215 340 L 215 240 Z"
  },
  {
    id: "non-binary",
    name: "Non-Binary",
    gender: "Non-Binary",
    outline: "M200 40 C 180 40, 160 60, 160 90 C 160 120, 180 140, 200 140 C 220 140, 240 120, 240 90 C 240 60, 220 40, 200 40 Z M185 140 L 185 160 L 215 160 L 215 140 Z M170 160 L 170 200 C 170 220, 180 240, 200 240 C 220 240, 230 220, 230 200 L 230 160 Z M150 180 L 120 200 L 130 280 L 160 260 Z M250 180 L 280 200 L 270 280 L 240 260 Z M185 240 L 185 340 L 200 340 L 200 240 Z M200 240 L 200 340 L 215 340 L 215 240 Z"
  }
];

const PRESET_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#FFB347", // Orange
  "#98D8C8", // Mint
  "#F7DC6F", // Gold
  "#BB8FCE", // Lavender
];

export default function BodyMappingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState("#FF6B6B");
  const [colorSegments, setColorSegments] = useState<ColorSegment[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [currentSegment, setCurrentSegment] = useState<ColorSegment | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<BodyType>(BODY_TYPES[0]);
  const [undoStack, setUndoStack] = useState<ColorSegment[][]>([]);
  const [redoStack, setRedoStack] = useState<ColorSegment[][]>([]);

  // Initialize canvas with body outline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw body outline using SVG path
    const drawBodyOutline = () => {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      
      // Create a path from the SVG data
      const path = new Path2D(selectedBodyType.outline);
      ctx.fill(path);
      ctx.stroke(path);
    };

    drawBodyOutline();
  }, [selectedBodyType]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev, colorSegments]);
    setRedoStack([]); // Clear redo stack when new action is performed
  }, [colorSegments]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, colorSegments]);
    setColorSegments(previousState);
    setUndoStack(prev => prev.slice(0, -1));
    
    // Redraw canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw body outline
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const path = new Path2D(selectedBodyType.outline);
    ctx.fill(path);
    ctx.stroke(path);
    
    // Redraw all segments
    previousState.forEach(segment => {
      ctx.fillStyle = segment.color;
      segment.pixels.forEach(pixel => {
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, brushSize / 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, [undoStack, colorSegments, selectedBodyType, brushSize]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, colorSegments]);
    setColorSegments(nextState);
    setRedoStack(prev => prev.slice(0, -1));
    
    // Redraw canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw body outline
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const path = new Path2D(selectedBodyType.outline);
    ctx.fill(path);
    ctx.stroke(path);
    
    // Redraw all segments
    nextState.forEach(segment => {
      ctx.fillStyle = segment.color;
      segment.pixels.forEach(pixel => {
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, brushSize / 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, [redoStack, colorSegments, selectedBodyType, brushSize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    
    // Save current state for undo
    saveToUndoStack();
    
    // Create new segment if none exists for this color
    let segment = colorSegments.find(seg => seg.color === selectedColor);
    if (!segment) {
      segment = {
        id: `segment-${Date.now()}`,
        color: selectedColor,
        name: `Part ${colorSegments.length + 1}`,
        pixels: []
      };
      setColorSegments(prev => [...prev, segment!]);
    }
    
    setCurrentSegment(segment);
  }, [selectedColor, colorSegments, saveToUndoStack]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentSegment) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pos = getMousePos(e);
    
    // Add pixel to current segment
    const newPixels = [...currentSegment.pixels, { x: pos.x, y: pos.y }];
    
    // Update segment
    setColorSegments(prev => 
      prev.map(seg => 
        seg.id === currentSegment.id 
          ? { ...seg, pixels: newPixels }
          : seg
      )
    );

    // Draw on canvas
    ctx.fillStyle = selectedColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  }, [isDrawing, currentSegment, selectedColor, brushSize]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentSegment(null);
  }, []);

  const handleSegmentNameChange = (segmentId: string, newName: string) => {
    setColorSegments(prev =>
      prev.map(seg =>
        seg.id === segmentId ? { ...seg, name: newName } : seg
      )
    );
  };

  const handleClearAll = () => {
    saveToUndoStack();
    setColorSegments([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw body outline
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const path = new Path2D(selectedBodyType.outline);
    ctx.fill(path);
    ctx.stroke(path);
  };

  const handleBodyTypeChange = (bodyType: BodyType) => {
    saveToUndoStack();
    setSelectedBodyType(bodyType);
    setColorSegments([]);
  };

  const handleSaveBodyMap = () => {
    console.log('Saving body map:', colorSegments);
    router.push('/workspace');
  };

  const handleDownloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'body-map.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/workspace")}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Body Mapping</h1>
                <p className="text-sm text-gray-400">Draw on the body to create part avatars</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All</span>
            </button>
            <button
              onClick={handleDownloadCanvas}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={handleSaveBodyMap}
              disabled={colorSegments.length === 0}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Create Parts</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Body Type Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Body Type</h2>
              <div className="space-y-2">
                {BODY_TYPES.map((bodyType) => (
                  <button
                    key={bodyType.id}
                    onClick={() => handleBodyTypeChange(bodyType)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedBodyType.id === bodyType.id
                        ? 'border-purple-500 bg-purple-600/20 text-purple-200'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{bodyType.name}</div>
                    <div className="text-sm opacity-75">{bodyType.gender}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-sm text-gray-300 mb-2">Selected Color:</p>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded border border-gray-600"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-sm text-gray-400">{selectedColor}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    title={`Select ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Custom Color</label>
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

            {/* Brush Size */}
            <div>
              <label className="block text-sm font-medium mb-2">Brush Size</label>
              <input
                type="range"
                min="5"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Small</span>
                <span>{brushSize}px</span>
                <span>Large</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Instructions</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Click and drag to draw on the body</li>
                <li>• Each color creates a separate part</li>
                <li>• Name your parts in the sidebar</li>
                <li>• Click "Create Parts" when done</li>
              </ul>
            </div>
          </div>

          {/* Drawing Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
              <h2 className="text-xl font-semibold mb-6 text-center">Body Canvas</h2>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-600 rounded-lg cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </div>

          {/* Parts List */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Created Parts</h2>
              {colorSegments.length === 0 ? (
                <p className="text-gray-400 text-sm">No parts created yet. Start drawing on the body.</p>
              ) : (
                <div className="space-y-3">
                  {colorSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: segment.color }}
                        />
                        <input
                          type="text"
                          value={segment.name}
                          onChange={(e) => handleSegmentNameChange(segment.id, e.target.value)}
                          className="bg-transparent text-white text-sm font-medium flex-1 focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Color: {segment.color} • {segment.pixels.length} pixels
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {colorSegments.length > 0 && (
              <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
                <h3 className="font-semibold mb-2 text-purple-200">Ready to Create Parts</h3>
                <p className="text-sm text-purple-100 mb-3">
                  You've created {colorSegments.length} part{colorSegments.length !== 1 ? 's' : ''}. 
                  Click "Create Parts" to add them to your map.
                </p>
                <button
                  onClick={handleSaveBodyMap}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                >
                  Create Parts & Go to Map
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}