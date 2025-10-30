"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { Handle, Position } from "@xyflow/react";
import { 
  BookOpen, 
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
  const [imagePreview, setImagePreview] = useState<string | null>(data.image || null);
  
  const {
    deleteEdges,
    deleteNode,
    removePartFromAllConflicts,
    updateNode,
    nodes,
    edges,
  } = useFlowNodesContext();
  const { setJournalTarget } = useJournalStore();

  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
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
        className="node part-node relative"
        style={{ width: '400px' }}
      >

        {/* Modern Card Design */}
        <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
          selectedPartId === partId 
            ? 'border-blue-500 shadow-blue-200 shadow-xl ring-2 ring-blue-200' 
            : 'hover:shadow-xl hover:border-blue-300 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100'
        }`}>
          
          {/* Header Section */}
          <div className="bg-white/60 backdrop-blur-sm border-b border-blue-200/30" style={{ height: '200px' }}>
            <div className="flex h-full">
              {/* Left Half - Name and Description */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h2
                    className="font-bold text-black flex items-center justify-center gap-1 text-center"
                    style={{ fontSize: '30px' }}
                  >
                    {data.name || data.label}
                  </h2>
                  {data.scratchpad && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {data.scratchpad}
                    </p>
                  )}
                </div>
                
                {/* Bottom Actions */}
                <div className="flex items-center justify-between mt-auto">
                  <div></div>
                </div>
              </div>

              {/* Right Half - Image */}
              <div className="w-1/2 relative bg-gray-100 border-l border-blue-200/30">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Part"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <SquareUserRound size={32} className="text-gray-400" />
                  </div>
                )}
                
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 shadow-md z-10"
                >
                  <Upload size={12} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Observations Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                {(data.partType || data.customPartType) && (
                  <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${getPartTypeColor(data.partType || data.customPartType)}`}>
                    {getPartTypeIcon(data.partType || data.customPartType)}
                    <span className="text-xs font-medium capitalize">
                      {data.partType || data.customPartType}
                    </span>
                  </div>
                )}
              </h3>
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
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default NewPartNode;
