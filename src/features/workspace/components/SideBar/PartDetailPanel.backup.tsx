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

const PartDetailPanel = () => {
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
  const { nodes, edges, updateNode } = useFlowNodesContext();

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {data.image ? (
                <Image
                  src={data.image as string}
                  alt="Part"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover rounded-full"
                />
              ) : (
                <SquareUserRound size={24} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{(data.name as string) || (data.label as string) || "Untitled"}</h2>
              <p className="text-white/80 text-sm">
                {(data.customPartType as string) || (data.partType as string) || "Custom"} Part
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPartId(undefined)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {/* Observations Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Observations
          </h3>
          <div className="space-y-4">
            {ImpressionList.map((impression) => {
              const impressions = (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];
              
              return (
                <div key={impression} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 capitalize">
                      {impression}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {impressions.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {impressions.map((imp, index) => (
                      <div key={index} className="bg-white rounded border p-3 flex items-center justify-between">
                        <span className="text-gray-700">{imp.data?.label || imp.id}</span>
                        <button className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Add new ${impression.toLowerCase()}...`}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          // TODO: Add impression logic
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1">
                      <Plus size={14} />
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs, Fears, Insights */}
        <div className="space-y-4">
          {/* Needs */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Needs
            </h4>
            <div className="space-y-2 mb-3">
              {((data.needs as string[]) || []).map((need: string, index: number) => (
                <div key={index} className="bg-white rounded border p-2 flex items-center justify-between">
                  <span className="text-sm text-green-700">{need}</span>
                  <button 
                    onClick={() => removeListItem("needs", index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add need..."
                className="flex-1 px-2 py-1 border rounded text-sm"
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
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Fears */}
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Fears
            </h4>
            <div className="space-y-2 mb-3">
              {((data.fears as string[]) || []).map((fear: string, index: number) => (
                <div key={index} className="bg-white rounded border p-2 flex items-center justify-between">
                  <span className="text-sm text-red-700">{fear}</span>
                  <button 
                    onClick={() => removeListItem("fears", index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add fear..."
                className="flex-1 px-2 py-1 border rounded text-sm"
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
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Insights
            </h4>
            <div className="space-y-2 mb-3">
              {((data.insights as string[]) || []).map((insight: string, index: number) => (
                <div key={index} className="bg-white rounded border p-2 flex items-center justify-between">
                  <span className="text-sm text-yellow-700">{insight}</span>
                  <button 
                    onClick={() => removeListItem("insights", index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add insight..."
                className="flex-1 px-2 py-1 border rounded text-sm"
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
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Relationships */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Relationships
          </h4>
          <div className="space-y-2">
            {relationships.length > 0 ? (
              relationships.map((rel) => (
                <div
                  key={rel.id}
                  className={`px-3 py-2 rounded border ${getRelationshipColor(rel.nodeType)}`}
                >
                  <div className="font-medium">{rel.nodeLabel}</div>
                  <div className="text-xs opacity-75 capitalize">{rel.nodeType}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic bg-gray-50 rounded px-3 py-2">
                No relationships yet
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PartDetailPanel;
