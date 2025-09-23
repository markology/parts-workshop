"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { 
  Eye, 
  Heart, 
  Brain, 
  Shield, 
  Users, 
  X, 
  Plus, 
  Trash2,
  SquareUserRound
} from "lucide-react";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { ImpressionNode } from "@/features/workspace/types/Nodes";
import { NodeBackgroundColors } from "@/features/workspace/constants/Nodes";
import ImpressionInput from "./Impressions/ImpressionInput";

const PartDetailPanel = () => {
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
  const { nodes, edges, updateNode } = useFlowNodesContext();
  const [addingImpressionType, setAddingImpressionType] = useState<string | null>(null);

  const partNode = useMemo(() => {
    if (!selectedPartId) return null;
    return nodes.find(node => node.id === selectedPartId);
  }, [selectedPartId, nodes]);

  const relationships = useMemo(() => {
    if (!selectedPartId) return [];
    const connectedEdges = edges.filter(
      (edge) => edge.source === selectedPartId || edge.target === selectedPartId
    );

    return connectedEdges.map((edge) => {
      const connectedNodeId = edge.source === selectedPartId ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);
      
      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        relationshipType: edge.data?.relationshipType || "connected",
      };
    });
  }, [edges, nodes, selectedPartId]);

  const getRelationshipColor = (nodeType: string) => {
    switch (nodeType) {
      case "conflict": return "bg-red-100 text-red-800 border-red-200";
      case "impression": return "bg-blue-100 text-blue-800 border-blue-200";
      case "part": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const addListItem = (field: string, newItem: string) => {
    if (!selectedPartId || !partNode || newItem.trim() === "") return;
    
    const currentList = (partNode.data[field as keyof typeof partNode.data] as string[]) || [];
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [field]: [...currentList, newItem.trim()],
      },
    });
  };

  const removeListItem = (field: string, index: number) => {
    if (!selectedPartId || !partNode) return;
    
    const currentList = (partNode.data[field as keyof typeof partNode.data] as string[]) || [];
    const newList = currentList.filter((_, i) => i !== index);
    
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [field]: newList,
      },
    });
  };

  if (!selectedPartId || !partNode) return null;

  const data = partNode.data;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedPartId(undefined)}
    >
      <div 
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-xl shadow-lg overflow-hidden w-full max-w-5xl max-h-[85vh] transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm p-4 border-b border-blue-200/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {data.image ? (
                  <Image
                    src={data.image as string}
                    alt="Part"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <SquareUserRound size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">{(data.name as string) || (data.label as string) || "Untitled"}</h2>
                <p className="text-gray-600 text-xs">
                  {(data.customPartType as string) || (data.partType as string) || "Custom"} Part
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPartId(undefined)}
              className="p-2 hover:bg-white/80 rounded-lg transition-colors bg-white/60"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)] bg-white/80 backdrop-blur-sm">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Left Column - Observations */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-black flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4" />
                Observations
              </h3>
              
              {ImpressionList.map((impression) => {
                const impressions = (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];
                
                return (
                  <div key={impression} className="bg-white/40 rounded-lg p-3 border border-blue-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 
                          className="font-semibold capitalize text-sm"
                          style={{ color: NodeBackgroundColors[impression] }}
                        >
                          {impression}
                        </h4>
                        <button
                          onClick={() => setAddingImpressionType(impression)}
                          className="p-1 rounded-full hover:bg-white/60 transition-colors"
                          style={{ color: NodeBackgroundColors[impression] }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${NodeBackgroundColors[impression]}20`,
                          color: NodeBackgroundColors[impression],
                        }}
                      >
                        {impressions.length}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mb-2">
                      {impressions.map((imp, index) => {
                        const bgColor = NodeBackgroundColors[impression];
                        
                        return (
                          <div 
                            key={index} 
                            className="rounded border border-blue-200/30 p-2 flex items-center justify-between"
                            style={{
                              backgroundColor: `${bgColor}20`,
                              color: bgColor,
                            }}
                          >
                            <span className="font-medium text-xs">{imp.data?.label || imp.id}</span>
                            <button className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                  </div>
                );
              })}
            </div>

            {/* Right Column - Needs, Fears, Insights, Relationships */}
            <div className="space-y-3">
              
              {/* Needs */}
              <div className="bg-white/40 rounded-lg p-3 border border-blue-200/50">
                <h4 className="font-semibold text-black mb-2 flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4" />
                  Needs
                </h4>
                <div className="space-y-1 mb-2">
                  {((data.needs as string[]) || []).map((need: string, index: number) => (
                    <div key={index} className="bg-white/40 rounded border border-blue-200/30 p-2 flex items-center justify-between">
                      <span className="text-xs text-black">{need}</span>
                      <button 
                        onClick={() => removeListItem("needs", index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Add need..."
                    className="flex-1 px-2 py-1 border border-blue-200/50 rounded text-xs bg-white/60 backdrop-blur-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addListItem("needs", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addListItem("needs", input.value);
                      input.value = "";
                    }}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Fears */}
              <div className="bg-white/40 rounded-lg p-3 border border-blue-200/50">
                <h4 className="font-semibold text-black mb-2 flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  Fears
                </h4>
                <div className="space-y-1 mb-2">
                  {((data.fears as string[]) || []).map((fear: string, index: number) => (
                    <div key={index} className="bg-white/40 rounded border border-blue-200/30 p-2 flex items-center justify-between">
                      <span className="text-xs text-black">{fear}</span>
                      <button 
                        onClick={() => removeListItem("fears", index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Add fear..."
                    className="flex-1 px-2 py-1 border border-blue-200/50 rounded text-xs bg-white/60 backdrop-blur-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addListItem("fears", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addListItem("fears", input.value);
                      input.value = "";
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white/40 rounded-lg p-3 border border-blue-200/50">
                <h4 className="font-semibold text-black mb-2 flex items-center gap-2 text-sm">
                  <Brain className="w-4 h-4" />
                  Insights
                </h4>
                <div className="space-y-1 mb-2">
                  {((data.insights as string[]) || []).map((insight: string, index: number) => (
                    <div key={index} className="bg-white/40 rounded border border-blue-200/30 p-2 flex items-center justify-between">
                      <span className="text-xs text-black">{insight}</span>
                      <button 
                        onClick={() => removeListItem("insights", index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Add insight..."
                    className="flex-1 px-2 py-1 border border-blue-200/50 rounded text-xs bg-white/60 backdrop-blur-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addListItem("insights", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addListItem("insights", input.value);
                      input.value = "";
                    }}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Relationships */}
              <div className="bg-white/40 rounded-lg p-3 border border-blue-200/50">
                <h4 className="font-semibold text-black mb-2 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  Relationships
                </h4>
                <div className="space-y-1">
                  {relationships.length > 0 ? (
                    relationships.map((rel) => (
                      <div
                        key={rel.id}
                        className="px-2 py-1 rounded border border-blue-200/30 bg-white/40"
                      >
                        <div className="font-medium text-black text-xs">{rel.nodeLabel}</div>
                        <div className="text-xs opacity-75 capitalize text-gray-600">{rel.nodeType}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic bg-white/40 rounded px-2 py-1 border border-blue-200/30 text-xs">
                      No relationships yet
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
        {/* Impression Input Modal */}
        {addingImpressionType && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Add {addingImpressionType} to {(data.name as string) || (data.label as string) || "Untitled"}
                </h3>
                <button
                  onClick={() => setAddingImpressionType(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={18} />
                </button>
              </div>
              <ImpressionInput 
                onAddImpression={(impressionData) => {
                  // Add impression directly to the part
                  const currentImpressions = (data[ImpressionTextType[addingImpressionType as keyof typeof ImpressionTextType]] as ImpressionNode[]) || [];
                  const newImpression: ImpressionNode = {
                    id: impressionData.id,
                    type: impressionData.type,
                    data: {
                      label: impressionData.label,
                      addedAt: Date.now()
                    },
                    position: { x: 0, y: 0 }
                  };
                  
                  updateNode(selectedPartId!, {
                    data: {
                      ...data,
                      [ImpressionTextType[addingImpressionType as keyof typeof ImpressionTextType]]: [...currentImpressions, newImpression],
                    },
                  });
                  
                  setAddingImpressionType(null);
                }}
                defaultType={addingImpressionType as any}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartDetailPanel;
