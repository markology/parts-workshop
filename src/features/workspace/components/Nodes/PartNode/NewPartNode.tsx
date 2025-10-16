"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { Handle, Position } from "@xyflow/react";
import { 
  BookOpen, 
  Pencil, 
  SquareUserRound, 
  Upload, 
  Trash2,
  User,
  Heart,
  Brain,
  Eye,
  Shield
} from "lucide-react";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { NodeBackgroundColors } from "@/features/workspace/constants/Nodes";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { ImpressionNode } from "@/features/workspace/types/Nodes";

const NewPartNode = ({ data, partId }: { data: PartNodeData; partId: string }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(data.name || data.label);
  const [imagePreview, setImagePreview] = useState<string | null>(data.image || null);
  
  const {
    deleteEdges,
    deleteNode,
    removePartFromAllConflicts,
    updatePartName,
    updateNode,
    nodes,
    edges,
  } = useFlowNodesContext();
  const { setJournalTarget } = useJournalStore();

  const isEditing = useUIStore((s) => s.isEditing);
  const setIsEditing = useUIStore((s) => s.setIsEditing);
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id: partId,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => {
              deleteNode(partId);
              removePartFromAllConflicts(partId);
              deleteEdges(partId);
            },
          },
        ],
        [deleteNode, removePartFromAllConflicts, deleteEdges, partId]
      ),
    });

  // Get relationships
  const relationships = useMemo(() => {
    const connectedEdges = edges.filter(
      (edge) => edge.source === partId || edge.target === partId
    );

    return connectedEdges.map((edge) => {
      const connectedNodeId = edge.source === partId ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);
      
      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        relationshipType: edge.data?.relationshipType || "conflict",
      };
    });
  }, [edges, nodes, partId]);

  // Get all observations for display, sorted by recency
  const allObservations = useMemo(() => {
    const observations = ImpressionList.flatMap((impressionType) => {
      const impressions = (data[ImpressionTextType[impressionType]] as ImpressionNode[]) || [];
      return impressions.map(imp => ({
        ...imp,
        impressionType,
        // Try multiple date fields, fallback to creation time
        addedAt: imp.data?.addedAt || imp.data?.createdAt || imp.data?.timestamp
      }));
    });

    console.log(observations);
    
    // Sort by recency (most recent first) - convert to numbers for proper comparison
    return observations.sort((a, b) => {
      const dateA = typeof a.addedAt === 'string' ? new Date(a.addedAt).getTime() : Number(a.addedAt || 0);
      const dateB = typeof b.addedAt === 'string' ? new Date(b.addedAt).getTime() : Number(b.addedAt || 0);
      return dateB - dateA; // Most recent first
    });
  }, [data]);

  const handleSaveName = useCallback(() => {
    if (name === data.name || name === "") {
      setIsEditing(false);
      setIsEditingName(false);
      if (name === "") setName(data.name || data.label);
      return;
    }

    updatePartName(partId, name);
    updateNode<PartNodeData>(partId, {
      data: {
        ...data,
        name: name,
      },
    });

    setIsEditing(false);
    setIsEditingName(false);
  }, [name, data, updatePartName, partId, setIsEditing, updateNode]);

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveName();
    }
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setImagePreview(imageUrl);
        updateNode<PartNodeData>(partId, {
          data: {
            ...data,
            image: imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };


  // Detect clicks outside the input
  useEffect(() => {
    if (!isEditing) handleSaveName();
  }, [handleSaveName, isEditing]);

  const getPartTypeColor = (partType: string) => {
    switch (partType) {
      case "manager": return "bg-blue-500 text-white";
      case "firefighter": return "bg-red-500 text-white";
      case "exile": return "bg-purple-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getPartTypeIcon = (partType: string) => {
    switch (partType) {
      case "manager": return <Brain className="w-4 h-4" />;
      case "firefighter": return <Shield className="w-4 h-4" />;
      case "exile": return <Heart className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };



  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className="node part-node relative w-[400px]"
      >

        {/* Modern Card Design */}
        <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
          selectedPartId === partId 
            ? 'border-blue-500 shadow-blue-200 shadow-xl ring-2 ring-blue-200' 
            : 'hover:shadow-xl hover:border-blue-300 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100'
        }`}>
          
          {/* Header Section */}
          <div className="bg-white/60 backdrop-blur-sm p-4 border-b border-blue-200/30">
            {/* Name - Top Left */}
            <div className="mb-3">
              {isEditingName ? (
                <input
                  className="font-bold text-black bg-transparent text-left min-w-[120px]"
                  style={{ fontSize: '30px' }}
                  ref={inputRef}
                  onKeyDown={handleEnter}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              ) : (
                <h2
                  onClick={() => {
                    setIsEditingName(true);
                    setIsEditing(true);
                  }}
                  className="font-bold text-black cursor-pointer hover:text-gray-700 flex items-center gap-1"
                  style={{ fontSize: '30px' }}
                >
                  {name}
                  <Pencil size={12} className="text-gray-600" />
                </h2>
              )}
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center justify-end gap-2 mb-3">
              {/* Conflict Status */}
              <div className="flex items-center gap-1 rounded-full px-2 py-1 bg-white/60">
                <div className="text-sm">
                  {(() => {
                    const conflictCount = relationships.filter(rel => rel.nodeType === 'conflict').length;
                    const allyCount = relationships.filter(rel => rel.nodeType === 'conflict' && rel.relationshipType === 'ally').length;
                    
                    if (conflictCount === 0) {
                      return '😊'; // Smiling warmly - no conflicts
                    } else if (conflictCount === 1 && allyCount === 0) {
                      return '😐'; // Neutral - 1 conflict but no allies
                    } else if (conflictCount === 1) {
                      return '😐'; // Neutral - 1 conflict but has allies
                    } else if (conflictCount === 2) {
                      return '😢'; // Sad - 2 conflicts
                    } else {
                      return '😰'; // Worried - 3 or more conflicts
                    }
                  })()}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {relationships.filter(rel => rel.nodeType === 'conflict').length}
                </span>
              </div>

              {/* Part Type Indicator */}
              {(data.partType || data.customPartType) && (
                <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${getPartTypeColor(data.partType || data.customPartType)}`}>
                  {getPartTypeIcon(data.partType || data.customPartType)}
                  <span className="text-xs font-medium capitalize">
                    {data.partType || data.customPartType}
                  </span>
                </div>
              )}
              
              {/* Journal Button with AI Sparkle */}
              <button
                onClick={() =>
                  setJournalTarget({
                    type: "node",
                    nodeId: partId,
                    nodeType: "part",
                    title: data.name || data.label,
                  })
                }
                className="relative p-2 bg-white/60 hover:bg-white/80 rounded-lg transition-colors group"
                title="Open AI Journal"
              >
                <BookOpen size={14} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                {/* AI Sparkle */}
                <div className="absolute -top-1 -right-1 text-purple-500 animate-pulse text-xs font-bold">
                  ✨
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              {/* Part Type Badge */}
              {(data.partType && data.partType !== "custom") || data.customPartType ? (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getPartTypeColor(data.partType || "custom")}`}>
                  {getPartTypeIcon(data.partType || "custom")}
                  <span className="uppercase text-xs">
                    {data.customPartType || data.partType}
                  </span>
                </div>
              ) : (
                <div></div>
              )}

              <div></div>
            </div>

            {/* Main Content Row */}
            <div className="flex items-center gap-4">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Part"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                  />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <SquareUserRound size={24} className="text-gray-400" />
                  </div>
                )}
                </div>
                
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 shadow-md"
                >
                  <Upload size={8} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
          </div>

              {/* Info Section */}
              <div className="flex-1 min-w-0">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Age</div>
                    <div className="text-sm font-semibold text-gray-800">{data.age || "?"}</div>
                            </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Gender</div>
                    <div className="text-sm font-semibold text-gray-800">{data.gender || "?"}</div>
                        </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Needs</div>
                    <div className="text-sm font-semibold text-gray-800">{(data.needs || []).length}</div>
                      </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Fears</div>
                    <div className="text-sm font-semibold text-gray-800">{(data.fears || []).length}</div>
                </div>
              </div>
                </div>
              </div>
            </div>

          {/* Observations Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Observations
              </h3>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {allObservations.length}
              </span>
            </div>

            <div 
              className="relative h-56 overflow-hidden rounded-lg bg-white/80 backdrop-blur-sm border border-blue-200/50 cursor-pointer hover:border-blue-300 hover:bg-white/90 transition-colors p-3"
              onClick={() => setSelectedPartId(partId)}
            >
              {allObservations.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {allObservations.slice(0, 12).map((obs, index) => {
                    const bgColor = NodeBackgroundColors[obs.impressionType];
                    
                    return (
                      <div
                        key={`${obs.impressionType}-${index}`}
                        className="px-2 py-1 rounded text-base font-medium text-left"
                        style={{
                          backgroundColor: `${bgColor}20`,
                          color: bgColor,
                        }}
                      >
                        {obs.data?.label || obs.id}
                  </div>
                    );
                  })}
                  {allObservations.length > 12 && (
                    <div className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">
                      +{allObservations.length - 12} more
                  </div>
                )}
              </div>
              ) : (
                <div className="text-gray-400 text-xs text-center py-4">
                  No observations yet
            </div>
              )}
              
              {/* Fade gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>


        {/* Handles for edges */}
        <Handle
          className="part-handle"
          type="source"
          position={Position.Top}
          id="top"
        />
        <Handle
          className="part-handle"
          type="source"
          position={Position.Bottom}
          id="bottom"
        />
        <Handle
          className="part-handle"
          type="source"
          position={Position.Left}
          id="left"
        />
        <Handle
          className="part-handle"
          type="source"
          position={Position.Right}
          id="right"
        />
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default NewPartNode;
