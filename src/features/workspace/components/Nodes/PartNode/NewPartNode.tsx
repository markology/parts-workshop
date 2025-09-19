"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { Handle, Position } from "@xyflow/react";
import { 
  BookOpen, 
  Pencil, 
  SquareUserRound, 
  Upload, 
  Plus, 
  Trash2,
  User,
  FileText,
  Heart,
  Brain,
  Eye,
  Shield,
  Users,
  Lightbulb
} from "lucide-react";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { ImpressionNode } from "@/features/workspace/types/Nodes";

const NewPartNode = ({ data, partId }: { data: PartNodeData; partId: string }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(data.name || data.label);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set());
  const [imagePreview, setImagePreview] = useState<string | null>(data.image || null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  
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
        relationshipType: edge.data?.relationshipType || "connected",
      };
    });
  }, [edges, nodes, partId]);

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

  const toggleBucketExpansion = (bucketType: string) => {
    setExpandedBuckets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bucketType)) {
        newSet.delete(bucketType);
      } else {
        newSet.add(bucketType);
      }
      return newSet;
    });
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

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
    setIsEditing(true);
  };

  const saveField = (field: string) => {
    if (tempValue.trim() === "") return;
    
    updateNode<PartNodeData>(partId, {
      data: {
        ...data,
        [field]: tempValue,
      },
    });
    
    setEditingField(null);
    setTempValue("");
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
    setIsEditing(false);
  };

  const addListItem = (field: string, newItem: string) => {
    if (newItem.trim() === "") return;
    
    const currentList = (data[field as keyof PartNodeData] as string[]) || [];
    updateNode<PartNodeData>(partId, {
      data: {
        ...data,
        [field]: [...currentList, newItem.trim()],
      },
    });
  };

  // const removeListItem = (field: string, index: number) => {
  //   const currentList = (data[field as keyof PartNodeData] as string[]) || [];
  //   updateNode<PartNodeData>(partId, {
  //     data: {
  //       ...data,
  //       [field]: currentList.filter((_, i) => i !== index),
  //     },
  //   });
  // };

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

  const getRelationshipColor = (nodeType: string) => {
    switch (nodeType) {
      case "conflict": return "bg-red-100 text-red-800 border-red-200";
      case "impression": return "bg-blue-100 text-blue-800 border-blue-200";
      case "part": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className="node part-node bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 rounded-2xl p-0 w-[400px] h-[600px] shadow-xl overflow-hidden"
      >
        {/* Card Header - Image and Name */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 p-4">
          {/* Part Type Badge */}
          <div className="absolute top-4 right-4">
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getPartTypeColor(data.partType || "custom")}`}>
              {getPartTypeIcon(data.partType || "custom")}
              <span className="uppercase">
                {data.customPartType || data.partType || "Custom"}
              </span>
            </div>
          </div>

          {/* Journal Button */}
          <button
            onClick={() =>
              setJournalTarget({
                type: "node",
                nodeId: partId,
                nodeType: "part",
                title: data.name || data.label,
              })
            }
            className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-lg"
            title="Open Journal"
          >
            <BookOpen size={18} />
          </button>

          {/* Image */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Part"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-lg">
                  <SquareUserRound size={40} className="text-white" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-white text-blue-500 rounded-full p-1 hover:bg-gray-100 shadow-md"
              >
                <Upload size={10} />
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

          {/* Name */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            {isEditingName ? (
              <input
                className="text-xl font-bold text-white bg-white/20 backdrop-blur-sm rounded px-2 py-1 w-full text-center"
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
                className="text-xl font-bold text-white cursor-pointer hover:text-gray-200 flex items-center justify-center gap-2"
              >
                {name}
                <Pencil size={14} className="text-white/70" />
              </h2>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 h-[calc(100%-12rem)]">
          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center bg-gray-100 rounded-lg p-2">
              <div className="text-xs text-gray-500">Age</div>
              <div className="text-sm font-bold text-gray-800">
                {data.age || "?"}
              </div>
            </div>
            <div className="text-center bg-gray-100 rounded-lg p-2">
              <div className="text-xs text-gray-500">Gender</div>
              <div className="text-sm font-bold text-gray-800">
                {data.gender || "?"}
              </div>
            </div>
            <div className="text-center bg-gray-100 rounded-lg p-2">
              <div className="text-xs text-gray-500">Type</div>
              <div className="text-sm font-bold text-gray-800 capitalize">
                {data.partType || "Custom"}
              </div>
            </div>
          </div>

          {/* Observations - Main Feature */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Observations
            </h3>
            <div className="space-y-1">
              {ImpressionList.map((impression) => (
                <div key={impression} className="bg-white rounded border">
                  <button
                    onClick={() => toggleBucketExpansion(impression)}
                    className="w-full px-2 py-1 text-left flex items-center justify-between hover:bg-gray-50 text-xs"
                  >
                    <span className="font-medium text-gray-700 capitalize">
                      {impression}
                    </span>
                    <span className="text-gray-500">
                      {(data[ImpressionTextType[impression]] as ImpressionNode[])?.length || 0}
                    </span>
                  </button>
                  {expandedBuckets.has(impression) && (
                    <div className="px-2 py-1 border-t bg-gray-50">
                      <div className="space-y-1">
                        {(data[ImpressionTextType[impression]] as ImpressionNode[])?.map((imp, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                            {imp.data?.label || imp.id}
                          </div>
                        )) || []}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats - Needs, Fears, Insights */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Needs */}
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-xs font-bold text-green-800 mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3" />
                Needs
              </div>
              <div className="space-y-1">
                {(data.needs || []).slice(0, 2).map((need, index) => (
                  <div key={index} className="text-xs text-green-700 bg-white rounded px-1 py-0.5">
                    {need}
                  </div>
                ))}
                {(data.needs || []).length > 2 && (
                  <div className="text-xs text-green-600">+{(data.needs || []).length - 2} more</div>
                )}
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Add..."
                    className="flex-1 px-1 py-0.5 text-xs border rounded"
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
                    className="px-1 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>

            {/* Fears */}
            <div className="bg-red-50 rounded-lg p-2">
              <div className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Fears
              </div>
              <div className="space-y-1">
                {(data.fears || []).slice(0, 2).map((fear, index) => (
                  <div key={index} className="text-xs text-red-700 bg-white rounded px-1 py-0.5">
                    {fear}
                  </div>
                ))}
                {(data.fears || []).length > 2 && (
                  <div className="text-xs text-red-600">+{(data.fears || []).length - 2} more</div>
                )}
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Add..."
                    className="flex-1 px-1 py-0.5 text-xs border rounded"
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
                    className="px-1 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-yellow-50 rounded-lg p-2">
              <div className="text-xs font-bold text-yellow-800 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Insights
              </div>
              <div className="space-y-1">
                <div className="text-xs text-yellow-700 bg-white rounded px-1 py-0.5">
                  No insights yet
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Add..."
                    className="flex-1 px-1 py-0.5 text-xs border rounded"
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
                    className="px-1 py-0.5 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Relationships */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Relationships
            </h3>
            <div className="space-y-1">
              {relationships.length > 0 ? (
                relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className={`px-2 py-1 rounded text-xs border ${getRelationshipColor(rel.nodeType)}`}
                  >
                    <div className="font-medium">{rel.nodeLabel}</div>
                    <div className="text-xs opacity-75 capitalize">{rel.nodeType}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 italic bg-gray-50 rounded px-2 py-1">
                  No relationships yet
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Description
            </h3>
            {editingField === "scratchpad" ? (
              <div className="space-y-2">
                <textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveField("scratchpad")}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startEditing("scratchpad", data.scratchpad ?? "")}
                className="w-full text-left text-xs text-gray-700 hover:text-gray-900 bg-gray-50 rounded px-2 py-1 min-h-[60px]"
              >
                {data.scratchpad || "Click to add description..."}
              </button>
            )}
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