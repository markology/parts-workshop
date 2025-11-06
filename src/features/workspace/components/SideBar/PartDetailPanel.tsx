"use client";

import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import Image from "next/image";
import { useThemeContext } from "@/state/context/ThemeContext";
import { 
  Eye, 
  Heart,
  Brain,
  Shield, 
  Users, 
  X, 
  Plus, 
  SquareUserRound,
  BookOpen,
  Calendar,
  User,
  ListRestart,
  FileText,
  Sparkles,
  Clock,
  Upload,
  Pencil,
  Trash2
} from "lucide-react";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType, ImpressionType } from "@/features/workspace/types/Impressions";
import { ImpressionNode } from "@/features/workspace/types/Nodes";
import { NodeBackgroundColors, NodeTextColors } from "@/features/workspace/constants/Nodes";
import ImpressionInput from "./Impressions/ImpressionInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSidebarStore } from "@/features/workspace/state/stores/Sidebar";

const PartDetailPanel = () => {
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
  const [isCollapsing, setIsCollapsing] = useState(false);
  
  const setShouldCollapseSidebar = useUIStore((s) => s.setShouldCollapseSidebar);
  const setJournalTarget = useJournalStore((s) => s.setJournalTarget);
  const { activeSidebarNode } = useSidebarStore();

  const handleClose = () => {
    // Detach close behavior from options/sidebar completely
    setSelectedPartId(undefined);
  };
  // Use selective subscriptions - only subscribe to updateNode function, not nodes/edges arrays
  const { updateNode, deleteNode, deleteEdges, removePartFromAllConflicts } = useFlowNodesContext();
  
  // Get nodes and edges from store - Zustand handles this efficiently
  const nodes = useWorkingStore((s) => s.nodes);
  const edges = useWorkingStore((s) => s.edges);
  
  // Use useMemo to compute derived values to prevent infinite loops
  const partNode = useMemo(() => {
    if (!selectedPartId) return null;
    return nodes.find(node => node.id === selectedPartId) || null;
  }, [selectedPartId, nodes]);
  
  const relatedEdges = useMemo(() => {
    if (!selectedPartId) return [];
    return edges.filter(
      (edge) => edge.source === selectedPartId || edge.target === selectedPartId
    );
  }, [selectedPartId, edges]);
  const { darkMode } = useThemeContext();

  const toRgba = (hex: string, opacity: number) => {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  const [addingImpressionType, setAddingImpressionType] = useState<string | null>(null);
  const setShowPartDetailImpressionInput = useUIStore((s) => s.setShowPartDetailImpressionInput);
  const [currentImpressionType, setCurrentImpressionType] = useState<string>("emotion");
  const accentHex =
    NodeBackgroundColors[
      currentImpressionType as keyof typeof NodeBackgroundColors
    ] ?? "#6366f1";
  const accentTextHex =
    NodeTextColors[
      currentImpressionType as keyof typeof NodeTextColors
    ] ?? "#312e81";
  const accentSoftBg = toRgba(accentHex, darkMode ? 0.26 : 0.14);
  const accentBorder = toRgba(accentHex, darkMode ? 0.55 : 0.28);
  const accentGlow = toRgba(accentHex, darkMode ? 0.42 : 0.24);
  const impressionTypeLabel = currentImpressionType
    ? currentImpressionType.charAt(0).toUpperCase() + currentImpressionType.slice(1)
    : "Impression";
  const [editingAge, setEditingAge] = useState(false);
  const [editingGender, setEditingGender] = useState(false);
  const [editingPartType, setEditingPartType] = useState(false);
  const [tempAge, setTempAge] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempPartType, setTempPartType] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempScratchpad, setTempScratchpad] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for scroll-to-section functionality
  const infoRef = useRef<HTMLDivElement>(null);
  const impressionsRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const relationshipsRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  
  // Active section tracking for TOC
  const [activeSection, setActiveSection] = useState<string>("info");
  
  // Scroll to section handler
  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement | null>, sectionId: string) => {
    if (sectionRef.current && scrollableContentRef.current) {
      const container = scrollableContentRef.current;
      const sectionElement = sectionRef.current;
      const containerRect = container.getBoundingClientRect();
      const sectionRect = sectionElement.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const offsetTop = scrollTop + (sectionRect.top - containerRect.top) - 20; // 20px padding from top
      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  
  // Journal state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  const [isLoadingJournal, setIsLoadingJournal] = useState(false);
  const [isExtractingImpressions, setIsExtractingImpressions] = useState(false);
  const [showInfoEditModal, setShowInfoEditModal] = useState(false);

  // Load journal entries when part is selected
  useEffect(() => {
    if (selectedPartId) {
      loadJournalEntries();
    }
  }, [selectedPartId]);

  // Initialize temp values from part data when part changes (only on selection change, not on every render)
  useEffect(() => {
    if (partNode && selectedPartId) {
      const data = partNode.data;
      setTempName((data.name as string) || (data.label as string) || "");
      setTempScratchpad((data.scratchpad as string) || "");
      setTempPartType((data.customPartType as string) || (data.partType as string) || "");
      setTempAge((data.age as string) || "Unknown");
      setTempGender((data.gender as string) || "");
      setActiveSection("info"); // Reset to top section when part changes
    }
  }, [selectedPartId]); // Only sync when selectedPartId changes, not on every partNode update

  const loadJournalEntries = async () => {
    if (!selectedPartId) return;
    
    setIsLoadingJournal(true);
    try {
      // Use the existing journal API that works with nodeId
      const response = await fetch(`/api/journal/node/${selectedPartId}`);
      if (response.ok) {
        const entry = await response.json();
        // Convert single entry to array format for consistency
        // Only show entries that have actual content
        if (entry && entry.content && entry.content.trim().length > 0) {
          setJournalEntries([entry]);
        } else {
          setJournalEntries([]);
        }
      } else if (response.status === 404) {
        // No journal entry exists yet
        setJournalEntries([]);
      }
    } catch (error) {
      console.error("Failed to load journal entries:", error);
      setJournalEntries([]);
    } finally {
      setIsLoadingJournal(false);
    }
  };

  const extractImpressionsFromEntry = async (entryId: string) => {
    if (!selectedPartId) return;
    
    setIsExtractingImpressions(true);
    try {
      const response = await fetch(`/api/journal/node/${selectedPartId}/extract-impressions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodeId: selectedPartId,
          journalEntryId: entryId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Impressions extracted:", result);
        
        // Add the extracted impressions to the part node's data
        if (result.impressions && result.impressions.length > 0 && partNode) {
          const updatedData = { ...partNode.data };
          
          // Group impressions by type and add them to the appropriate buckets
          result.impressions.forEach((impression: any) => {
            const type = impression.type;
            const impressionTypeKey = ImpressionTextType[type as keyof typeof ImpressionTextType];
            
            if (impressionTypeKey) {
              const currentImpressions = (updatedData[impressionTypeKey] as ImpressionNode[]) || [];
              const newImpression: ImpressionNode = {
                id: impression.id,
                type: type,
                data: {
                  label: impression.label,
                  addedAt: Date.now()
                },
                position: { x: 0, y: 0 }
              };
              
              updatedData[impressionTypeKey] = [...currentImpressions, newImpression];
            }
          });
          
          // Update the part node with the new impressions
          updateNode(selectedPartId, {
            data: updatedData
          });
          
          console.log(`Successfully added ${result.impressions.length} impressions to the part!`);
        }
        
        // Refresh the journal entries to show updated content
        await loadJournalEntries();
      }
    } catch (error) {
      console.error("Failed to extract impressions:", error);
    } finally {
      setIsExtractingImpressions(false);
    }
  };

  // Handle Escape key to close impression modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && addingImpressionType) {
        setAddingImpressionType(null);
      }
    };

    if (addingImpressionType) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [addingImpressionType]);

  // Sync addingImpressionType with global state for sidebar visibility
  useEffect(() => {
    setShowPartDetailImpressionInput(!!addingImpressionType);
  }, [addingImpressionType, setShowPartDetailImpressionInput]);

  const handleRemoveImpression = (impressionType: string, impressionId: string) => {
    if (!selectedPartId || !partNode) return;

    const currentImpressions = (partNode.data[ImpressionTextType[impressionType as keyof typeof ImpressionTextType]] as ImpressionNode[]) || [];
    const filteredImpressions = currentImpressions.filter(imp => imp.id !== impressionId);

    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [ImpressionTextType[impressionType as keyof typeof ImpressionTextType]]: filteredImpressions,
      },
    });
  };

  const handleDropImpression = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedPartId || !partNode) return;

    // Get impression data from sidebar store or dataTransfer
    let impressionData: { id: string; type: ImpressionType; label: string } | null = null;

    if (activeSidebarNode?.type) {
      impressionData = {
        id: activeSidebarNode.id,
        type: activeSidebarNode.type,
        label: activeSidebarNode.label,
      };
    } else {
      // Fallback: read from dataTransfer
      const data = e.dataTransfer.getData("parts-workshop/sidebar-impression");
      if (data) {
        try {
          const parsed = JSON.parse(data) as { type: ImpressionType; id: string };
          const impressions = useWorkingStore.getState().sidebarImpressions;
          const impression = impressions[parsed.type]?.[parsed.id];
          if (impression) {
            impressionData = {
              id: impression.id,
              type: impression.type,
              label: impression.label,
            };
          }
        } catch (error) {
          console.error("Failed to parse drag data:", error);
          return;
        }
      }
    }

    if (!impressionData) return;

    // Add impression to the part
    const impressionTypeKey = ImpressionTextType[impressionData.type as keyof typeof ImpressionTextType];
    const currentImpressions = (partNode.data[impressionTypeKey] as ImpressionNode[]) || [];
    
    // Check if impression already exists
    if (currentImpressions.find(imp => imp.id === impressionData.id)) {
      return; // Already exists
    }

    const newImpression: ImpressionNode = {
      id: impressionData.id,
      type: impressionData.type,
      data: {
        label: impressionData.label,
        addedAt: Date.now()
      },
      position: { x: 0, y: 0 }
    };

    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [impressionTypeKey]: [...currentImpressions, newImpression],
      },
    });

    // Remove from sidebar
    useWorkingStore.getState().removeImpression({ type: impressionData.type, id: impressionData.id });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleReturnToSidebar = (impressionType: string, impressionId: string) => {
    if (!selectedPartId || !partNode) return;

    const currentImpressions = (partNode.data[ImpressionTextType[impressionType as keyof typeof ImpressionTextType]] as ImpressionNode[]) || [];
    const impressionToReturn = currentImpressions.find(imp => imp.id === impressionId);
    const filteredImpressions = currentImpressions.filter(imp => imp.id !== impressionId);

    // Remove from part
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [ImpressionTextType[impressionType as keyof typeof ImpressionTextType]]: filteredImpressions,
      },
    });

    // Return to sidebar
    if (impressionToReturn) {
      useWorkingStore.getState().addImpression({
        id: impressionToReturn.id,
        type: impressionToReturn.type,
        label: impressionToReturn.data.label,
      });
    }
  };

  const getXButtonColor = (impressionType: string) => {
    const colorMap: { [key: string]: string } = {
      emotion: "#ed9f9f",
      thought: "#9fc7e8", 
      sensation: "#f5c99a",
      behavior: "#a8d4a8",
      conflict: "#c4a8e0",
      ally: "#a8d4a8",
      part: "#c4d4e8",
      other: "#f0b8d0"
    };
    return colorMap[impressionType] || "#ed9f9f";
  };

  // Calculate relationships from the related edges and nodes
  const relationships = useMemo(() => {
    if (!selectedPartId || !relatedEdges.length) return [];
    
    return relatedEdges.map((edge) => {
      const connectedNodeId = edge.source === selectedPartId ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);
      
      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        nodeDescription: (connectedNode?.data?.scratchpad as string) || (connectedNode?.data?.description as string) || "",
        relationshipType: edge.data?.relationshipType || "conflict",
      };
    });
  }, [relatedEdges, nodes, selectedPartId]);


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

  const saveAge = () => {
    if (!selectedPartId || !partNode) return;
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        age: tempAge.trim() || "Unknown",
      },
    });
    setEditingAge(false);
    setTempAge("");
  };

  const saveGender = () => {
    if (!selectedPartId || !partNode) return;
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        gender: tempGender.trim() || "Unknown",
      },
    });
    setEditingGender(false);
    setTempGender("");
  };

  const savePartType = () => {
    if (!selectedPartId || !partNode) return;
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        customPartType: tempPartType || "manager",
      },
    });
    setEditingPartType(false);
    setTempPartType("");
  };

  const saveName = () => {
    if (!selectedPartId || !partNode) return;
    const trimmedName = tempName.trim();
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        name: trimmedName || "",
        label: trimmedName || "",
      },
    });
    setTempName(trimmedName);
  };

  const saveScratchpad = () => {
    if (!selectedPartId || !partNode) return;
    const trimmedScratchpad = tempScratchpad.trim();
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        scratchpad: trimmedScratchpad,
      },
    });
    setTempScratchpad(trimmedScratchpad);
  };

  const saveInfo = () => {
    if (!selectedPartId || !partNode) return;
    const trimmedName = tempName.trim();
    const trimmedScratchpad = tempScratchpad.trim();
    const trimmedAge = tempAge.trim() === "" || tempAge === "Unknown" ? "Unknown" : tempAge.trim();
    const trimmedGender = tempGender.trim();
    
    // Use requestAnimationFrame to batch the update and avoid ResizeObserver issues
    requestAnimationFrame(() => {
      updateNode(selectedPartId, {
        data: {
          ...partNode.data,
          name: trimmedName || "",
          label: trimmedName || "",
          scratchpad: trimmedScratchpad,
          customPartType: tempPartType || undefined,
          age: trimmedAge || "Unknown",
          gender: trimmedGender || undefined,
        },
      });
      
      setTempName(trimmedName);
      setTempScratchpad(trimmedScratchpad);
      setTempAge(trimmedAge);
      setTempGender(trimmedGender);
    });
  };

  const handleModalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPartId && partNode) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        updateNode(selectedPartId!, {
          data: {
            ...partNode!.data,
            image: imageDataUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPartId && partNode) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        updateNode(selectedPartId, {
          data: {
            ...partNode.data,
            image: imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!selectedPartId || !partNode) return null;

  const data = partNode.data;
  const containerClasses = `${
    darkMode
      ? "bg-slate-950/95 border border-slate-800 text-slate-100"
      : "bg-white border border-slate-200 text-slate-900"
  } relative rounded-[28px] shadow-[0_24px_60px_rgba(15,23,42,0.28)] overflow-hidden w-full max-w-5xl max-h-[85vh] flex flex-col transition-all duration-300`;

  const navContainerClasses = darkMode
    ? "bg-slate-950/75 border-r border-slate-800/70"
    : "bg-white/90 border-r border-slate-200/80";

  const navButtonClasses = darkMode
    ? "text-slate-300 hover:bg-slate-900/40 hover:text-white"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  const sectionCardClasses = darkMode
    ? "bg-slate-950/70 border border-slate-800/70 shadow-[0_16px_48px_rgba(8,15,30,0.36)] rounded-[22px]"
    : "bg-white border border-slate-200 shadow-[0_20px_55px_rgba(15,23,42,0.12)] rounded-[22px]";

  const subCardClasses = darkMode
    ? "bg-slate-950/60 border border-slate-800/70 rounded-xl"
    : "bg-slate-50 border border-slate-200 rounded-xl";

  const listItemClasses = darkMode
    ? "bg-slate-950/50 border border-slate-800/60 text-slate-200"
    : "bg-white border border-slate-200 text-slate-700";

  const modalContainerClasses = darkMode
    ? "bg-slate-950/95 border border-slate-800 text-slate-100"
    : "bg-white border border-slate-200 text-slate-900";

  const modalFieldCardClasses = darkMode
    ? "bg-slate-950/75 border border-slate-800/70 rounded-2xl"
    : "bg-slate-50 border border-slate-200 rounded-2xl";

  const modalInputClasses = darkMode
    ? "bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400";

  const modalTextareaClasses = darkMode
    ? "bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400";

  const modalLabelClasses = darkMode ? "text-slate-200" : "text-slate-700";

  const handleDeletePart = () => {
    if (!selectedPartId) return;
    const confirmed = window.confirm("Delete this part and all related connections?");
    if (!confirmed) return;
    removePartFromAllConflicts(selectedPartId);
    deleteEdges(selectedPartId);
    deleteNode(selectedPartId);
    setSelectedPartId(undefined);
  };

  const handleBackdropClick = () => {
    if (addingImpressionType) return;
    setSelectedPartId(undefined);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl">
        {/* Close Button - To the right of container */}
        <button
          onClick={handleClose}
          className="absolute -right-12 top-0 z-[60] hover:opacity-70 transition-opacity"
          aria-label="Close"
        >
          <X 
            className="text-white" 
            strokeWidth={2} 
            size={30} 
          />
        </button>

        <div
          className={containerClasses}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Content with TOC */}
        <div className="flex flex-row flex-1 overflow-hidden min-h-0">
          {/* Table of Contents - Left Column */}
          <div className={`w-52 flex-shrink-0 flex flex-col ${navContainerClasses}`}>
            <nav className="flex-1 overflow-y-auto px-5 py-5 space-y-2">
              <button
                onClick={() => scrollToSection(infoRef, 'info')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Info</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(insightsRef, 'insights')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-sky-600" />
                  <span>Insights</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(impressionsRef, 'impressions')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>Impressions</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(journalRef, 'journal')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Journal</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(relationshipsRef, 'relationships')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span>Relationships</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Main Content - Right Column */}
          <div ref={scrollableContentRef} className="flex-1 p-8 overflow-y-auto space-y-12 bg-transparent">

          {/* Info Section */}
          <div ref={infoRef} className="transition-all duration-300 relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className={`text-[11px] font-semibold uppercase tracking-[0.32em] flex items-center gap-2 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}>
                  <User className="w-3 h-3 text-emerald-600" />
                  Info
                </h3>
                <button
                  onClick={() => setShowInfoEditModal(true)}
                  className={`p-2 rounded-full border transition-colors ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-900/60"
                      : "border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                  aria-label="Edit info"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedPartId && partNode) {
                      setJournalTarget({
                        type: "node",
                        nodeId: selectedPartId,
                        nodeType: "part",
                        title: partNode.data?.label || "Part",
                      });
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    darkMode
                      ? "border-purple-400/60 text-purple-200 bg-slate-950/60 hover:bg-slate-900/60"
                      : "border-purple-300/70 text-purple-600 bg-white hover:bg-purple-50"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${darkMode ? "text-purple-300" : "text-purple-500"}`} />
                  <span>Deepen</span>
                </button>
                <button
                  onClick={handleDeletePart}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                    darkMode
                      ? "bg-rose-600/80 text-white hover:bg-rose-500"
                      : "bg-rose-600 text-white hover:bg-rose-500"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
            
            {/* Main Info Grid */}
            <div className={`${sectionCardClasses} p-6 space-y-6`}>
              {/* First Row: Image and Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image - Left Column */}
                <div className="lg:col-span-1">
                  <div className={`${subCardClasses} w-full aspect-square relative shadow-sm overflow-hidden group`}>
                    {data.image ? (
                      <>
                        <Image
                          src={data.image as string}
                          alt="Part"
                          width={256}
                          height={256}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <Upload className="w-8 h-8 text-white" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full h-full ${
                          darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-100 hover:bg-gray-200"
                        } flex flex-col items-center justify-center cursor-pointer`}
                      >
                        <SquareUserRound size={64} className={darkMode ? "text-gray-300" : "text-gray-400"} />
                        <span className={`text-xs mt-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                          Click to upload
                        </span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Info Fields - Right Columns */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Name and Part Type Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-black"}`}>
                        {(data.name as string) || (data.label as string) || "Untitled"}
                      </h2>
                      <div className="flex items-center gap-2">
                        {['manager', 'firefighter', 'exile'].map((type) => {
                          const currentType = tempPartType || (data.customPartType as string) || (data.partType as string) || "";
                          const isSelected = currentType === type;
                          if (!isSelected) return null;
                          return (
                            <span
                              key={type}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                type === "manager"
                                  ? "bg-blue-600 text-white"
                                  : type === "firefighter"
                                    ? "bg-red-600 text-white"
                                    : "bg-purple-600 text-white"
                              }`}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          );
                        })}
                        {!tempPartType && !(data.customPartType as string) && !(data.partType as string) && (
                          <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                            No type set
                          </span>
                        )}
                        {/* Age and Gender Display - To the right of part type */}
                        {(data.age as string) || (data.gender as string) ? (
                          <>
                            {(data.age as string) && (data.age as string) !== "Unknown" && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}>
                                {data.age as string}
                              </span>
                            )}
                            {(data.gender as string) && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}>
                                {data.gender as string}
                              </span>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className={`text-base leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap`}>
                      {(data.scratchpad as string) || (
                        <span className={darkMode ? "text-gray-500" : "text-gray-400"}>
                          No description added yet.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div ref={insightsRef} className="transition-all duration-300 relative space-y-4">
            <h4 className={`text-[11px] font-semibold uppercase tracking-[0.32em] flex items-center gap-2 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <Brain className="w-3 h-3 text-sky-600" />
              Insights
            </h4>
            <div className={`${sectionCardClasses} p-6`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Needs */}
                <div className={`${subCardClasses} p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold capitalize text-sm ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                      Needs
                    </h4>
                    <button
                      onClick={() => {
                        const input = prompt("Add a need:");
                        if (input?.trim()) {
                          addListItem("needs", input.trim());
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        darkMode
                          ? "border-slate-700 text-slate-200 hover:bg-slate-900/50"
                          : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {((data.needs as string[]) || []).map((need: string, index: number) => (
                      <div
                        key={index}
                        className={`${listItemClasses} group flex items-center justify-between rounded-lg px-3 py-2`}
                      >
                        <span className="text-xs font-medium leading-relaxed">{need}</span>
                        <button
                          onClick={() => removeListItem("needs", index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          aria-label="Remove need"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {((data.needs as string[]) || []).length === 0 && (
                      <div className={`text-center py-4 text-xs italic ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        No needs added yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Fears */}
                <div className={`${subCardClasses} p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold capitalize text-sm ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                      Fears
                    </h4>
                    <button
                      onClick={() => {
                        const input = prompt("Add a fear:");
                        if (input?.trim()) {
                          addListItem("fears", input.trim());
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        darkMode
                          ? "border-slate-700 text-slate-200 hover:bg-slate-900/50"
                          : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {((data.fears as string[]) || []).map((fear: string, index: number) => (
                      <div
                        key={index}
                        className={`${listItemClasses} group flex items-center justify-between rounded-lg px-3 py-2`}
                      >
                        <span className="text-xs font-medium leading-relaxed">{fear}</span>
                        <button
                          onClick={() => removeListItem("fears", index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          aria-label="Remove fear"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {((data.fears as string[]) || []).length === 0 && (
                      <div className={`text-center py-4 text-xs italic ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        No fears added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impressions Section */}
          <div ref={impressionsRef} className="transition-all duration-300 relative space-y-4">
            <h3 className={`text-[11px] font-semibold uppercase tracking-[0.32em] flex items-center gap-2 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <Eye className="w-3 h-3 text-purple-600" />
              Impressions
            </h3>

            {/* Flexible Layout for Impressions */}
            <div 
              className={`${sectionCardClasses} p-6`}
              onDrop={handleDropImpression}
              onDragOver={handleDragOver}
            >
              <div className="space-y-4">
                {/* All Impressions: emotion, thought, sensation, behavior, other */}
                <div className="columns-1 lg:columns-2 gap-4 space-y-4">
                  {ImpressionList.map((impression) => {
                    const impressions = (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];

                    return (
                      <div key={impression} className={`break-inside-avoid ${subCardClasses} p-4 shadow-sm mb-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4
                              className="font-semibold capitalize text-sm"
                              style={{ color: NodeBackgroundColors[impression] }}
                            >
                              {impression}
                            </h4>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: toRgba(NodeBackgroundColors[impression], darkMode ? 0.45 : 0.24),
                                color: darkMode ? "rgba(255,255,255,0.92)" : (NodeTextColors[impression] || NodeBackgroundColors[impression]),
                              }}
                            >
                              {impressions.length}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setAddingImpressionType(impression);
                              setCurrentImpressionType(impression);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                              darkMode
                                ? "border-slate-700 text-slate-200 hover:bg-slate-900/50"
                                : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                            }`}
                            style={{
                              borderColor: `${NodeBackgroundColors[impression]}40`,
                            }}
                          >
                            Add
                          </button>
                        </div>

                        <div className="space-y-2 mb-2">
                          {impressions.map((imp, index) => {
                            const accent = NodeBackgroundColors[impression];
                            const accentText = NodeTextColors[impression] || accent;
                            const chipBackground = toRgba(accent, darkMode ? 0.45 : 0.24);
                            const chipBorder = toRgba(accent, darkMode ? 0.65 : 0.32);

                            return (
                              <div
                                key={index}
                                className={`${listItemClasses} group flex items-center justify-between rounded-xl border px-3 py-2 shadow-sm`}
                                style={{
                                  backgroundColor: chipBackground,
                                  borderColor: chipBorder,
                                  color: darkMode ? "rgba(255,255,255,0.92)" : accentText,
                                }}
                              >
                                <span className="font-medium text-xs">{imp.data?.label || imp.id}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleReturnToSidebar(impression, imp.id)}
                                    className="p-1"
                                    style={{
                                      color: getXButtonColor(impression),
                                    }}
                                    title="Return to sidebar"
                                  >
                                    <ListRestart size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveImpression(impression, imp.id)}
                                    className="p-1"
                                    style={{
                                      color: getXButtonColor(impression),
                                    }}
                                    title="Delete"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Journal History Section */}
          <div ref={journalRef} className="transition-all duration-300 relative space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-[11px] font-semibold uppercase tracking-[0.32em] flex items-center gap-2 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}>
                <BookOpen className="w-3 h-3 text-amber-600" />
                Journal
              </h3>
              <button
                onClick={() => {
                  if (selectedPartId && partNode) {
                    setJournalTarget({
                      type: "node",
                      nodeId: selectedPartId,
                      nodeType: "part",
                      title: partNode.data?.label || "Part",
                    });
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  darkMode
                    ? "border-purple-400/60 text-purple-200 bg-slate-950/60 hover:bg-slate-900/60"
                    : "border-purple-300/70 text-purple-600 bg-white hover:bg-purple-50"
                }`}
              >
                <Sparkles className={`w-3 h-3 ${darkMode ? "text-purple-300" : "text-purple-500"}`} />
                <span>New Entry</span>
              </button>
            </div>

            <div className={`${sectionCardClasses} p-6`}>
              {isLoadingJournal ? (
                <div className={`${subCardClasses} flex flex-col items-center justify-center gap-3 py-8`}>
                  <LoadingSpinner variant="sparkles" size="md" message="Loading journal entries..." />
                </div>
              ) : journalEntries.length === 0 ? (
                <div className={`${subCardClasses} text-center py-8 px-4`}> 
                  <BookOpen className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-slate-100" : "text-slate-700"}`}>
                    No journal entries yet
                  </h3>
                  <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                    Start writing about this part to see entries here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry) => (
                    <div key={entry.id} className={`${subCardClasses} p-5 shadow-sm`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                          <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                            {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <button
                          onClick={() => extractImpressionsFromEntry(entry.id)}
                          disabled={isExtractingImpressions}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            isExtractingImpressions
                              ? darkMode
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-200 text-slate-500"
                              : darkMode
                                ? "bg-slate-100/10 text-white hover:bg-slate-100/20"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {isExtractingImpressions ? (
                            <>
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              <span>Extracting...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Extract impressions</span>
                            </>
                          )}
                        </button>
                      </div>
                      {entry.title && (
                        <h4 className={`font-semibold mb-2 ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                          {entry.title}
                        </h4>
                      )}
                      <div className={`whitespace-pre-wrap text-sm leading-relaxed ${
                        darkMode ? "text-slate-300" : "text-slate-700"
                      }`}>
                        {entry.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Relationships Section */}
          <div ref={relationshipsRef} className="transition-all duration-300 relative space-y-4">
            <h3 className={`text-[11px] font-semibold uppercase tracking-[0.32em] flex items-center gap-2 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <Users className="w-3 h-3 text-rose-600" />
              Relationships
            </h3>

            <div className={`${sectionCardClasses} p-6`}>
              {relationships.length > 0 ? (
                <div className="space-y-4">
                  {relationships.map((rel) => {
                    const isTension = rel.relationshipType === "tension";
                    const isInteraction = rel.relationshipType === "interaction";

                    return (
                      <div key={rel.id} className={`${subCardClasses} p-5 shadow-sm`}>
                        <div
                          className={`px-3 py-3 rounded-xl border ${
                            isTension
                              ? darkMode
                                ? "border-purple-400/70 bg-purple-900/40"
                                : "border-purple-300/80 bg-purple-50"
                              : isInteraction
                                ? darkMode
                                  ? "border-sky-400/70 bg-sky-900/35"
                                  : "border-sky-300/80 bg-sky-50"
                                : darkMode
                                  ? "border-slate-700 bg-slate-900/50"
                                  : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className={`font-semibold text-sm mb-2 ${
                            isTension
                              ? darkMode
                                ? "text-purple-200"
                                : "text-purple-900"
                              : isInteraction
                                ? darkMode
                                  ? "text-sky-200"
                                  : "text-sky-900"
                                : darkMode
                                  ? "text-slate-100"
                                  : "text-slate-900"
                          }`}>
                            {rel.nodeLabel}
                          </div>
                          {rel.nodeDescription && String(rel.nodeDescription).trim() ? (
                            <div className={`text-xs mb-2 leading-relaxed whitespace-pre-wrap ${
                              isTension
                                ? darkMode
                                  ? "text-purple-300"
                                  : "text-purple-700"
                                : isInteraction
                                  ? darkMode
                                    ? "text-sky-300"
                                    : "text-sky-700"
                                  : darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                            }`}>
                              {String(rel.nodeDescription)}
                            </div>
                          ) : null}
                          <div className={`text-xs font-medium capitalize mt-2 ${
                            isTension
                              ? darkMode
                                ? "text-purple-300"
                                : "text-purple-700"
                              : isInteraction
                                ? darkMode
                                  ? "text-sky-300"
                                  : "text-sky-700"
                                : darkMode
                                  ? "text-slate-400"
                                  : "text-slate-600"
                          }`}>
                            {isTension ? "⚔️ Tension" : isInteraction ? "🤝 Interaction" : rel.nodeType}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`${subCardClasses} text-center py-8`}> 
                  <Users className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-slate-100" : "text-slate-700"}`}>
                    No relationships yet
                  </h3>
                  <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                    No relationships have been created for this part.
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
        
        {/* Impression Input Modal */}
        {addingImpressionType && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setAddingImpressionType(null);
              }
            }}
          >
            <div
              className={`absolute inset-0 pointer-events-none ${
                darkMode ? "bg-slate-950/95" : "bg-slate-900/60"
              } backdrop-blur-sm`}
            />
            <div
              className="relative w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`relative overflow-hidden rounded-[28px] border ${
                  darkMode
                    ? "border-slate-700/60 bg-slate-900/85"
                    : "border-slate-200/80 bg-white/95"
                } shadow-[0_30px_70px_rgba(15,23,42,0.36)]`}
              >
                <div className="relative px-8 pt-8 pb-6 space-y-7">
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-3">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
                        style={{
                          backgroundColor: accentSoftBg,
                          color: accentTextHex,
                        }}
                      >
                        <Sparkles size={14} />
                        {impressionTypeLabel}
                      </span>
                      <div>
                        <h3
                          className={`text-2xl font-semibold ${
                            darkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Add a new {impressionTypeLabel.toLowerCase()} to {(data.name as string) || (data.label as string) || "this part"}
                        </h3>
                        <p
                          className={`mt-2 text-sm leading-relaxed ${
                            darkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Give {(data.name as string) || (data.label as string) || "this part"} a voice by noting what you're sensing right now.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAddingImpressionType(null)}
                      className={`h-10 w-10 flex items-center justify-center rounded-full border transition-colors ${
                        darkMode
                          ? "border-slate-700 text-slate-300 hover:bg-slate-800/70"
                          : "border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div
                    className="rounded-2xl border px-6 py-6 shadow-inner"
                    style={{
                      backgroundColor: accentSoftBg,
                      borderColor: accentBorder,
                    }}
                  >
                    <ImpressionInput
                      onAddImpression={(impressionData) => {
                        // Add impression directly to the part using the actual selected type
                        const impressionTypeKey =
                          ImpressionTextType[
                            impressionData.type as keyof typeof ImpressionTextType
                          ];
                        const currentImpressions =
                          (data[impressionTypeKey] as ImpressionNode[]) || [];
                        const newImpression: ImpressionNode = {
                          id: impressionData.id,
                          type: impressionData.type,
                          data: {
                            label: impressionData.label,
                            addedAt: Date.now(),
                          },
                          position: { x: 0, y: 0 },
                        };

                        updateNode(selectedPartId!, {
                          data: {
                            ...data,
                            [impressionTypeKey]: [...currentImpressions, newImpression],
                          },
                        });

                        // Don't close the modal, just clear the input
                        // setAddingImpressionType(null);
                      }}
                      onTypeChange={(type) => setCurrentImpressionType(type)}
                      defaultType={addingImpressionType as ImpressionType}
                    />
                  </div>

                  <div className={`flex items-center gap-3 flex-wrap ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <div className="flex items-center gap-1.5">
                      <kbd className={`px-2 py-1 rounded text-[10px] font-semibold ${
                        darkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-700"
                      }`}>
                        Tab
                      </kbd>
                      <span className="text-xs">Switch types</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className={`px-2 py-1 rounded text-[10px] font-semibold ${
                        darkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-700"
                      }`}>
                        Enter
                      </kbd>
                      <span className="text-xs">Submit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Edit Modal */}
        {showInfoEditModal && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4"
            onClick={() => setShowInfoEditModal(false)}
          >
            <div
              className={`${modalContainerClasses} rounded-[24px] shadow-[0_20px_48px_rgba(15,23,42,0.26)] w-full max-w-2xl max-h-[80vh] mx-4 overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 space-y-6 overflow-y-auto">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Info
                    </p>
                    <h3 className="text-2xl font-semibold mt-2">Edit details</h3>
                    <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Update the basics for {(data.name as string) || (data.label as string) || "your part"}.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInfoEditModal(false)}
                    className={`p-2 rounded-full border transition-colors ${
                      darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-900/60" : "border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-5">
                    <div className={`${modalFieldCardClasses} p-5 space-y-5`}>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${modalLabelClasses}`}>Name</label>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className={`w-full text-base rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalInputClasses}`}
                          placeholder="Part name"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className={`text-sm font-medium ${modalLabelClasses}`}>Part type</label>
                        <div className="flex flex-wrap gap-2">
                          {['manager', 'firefighter', 'exile'].map((type) => {
                            const currentType = tempPartType || (data.customPartType as string) || (data.partType as string) || "";
                            const isSelected = currentType === type;
                            return (
                              <button
                                key={type}
                                onClick={() => {
                                  setTempPartType(type);
                                }}
                                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                                  isSelected
                                    ? type === "manager"
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : type === "firefighter"
                                        ? "bg-red-500 text-white shadow-sm"
                                        : "bg-purple-500 text-white shadow-sm"
                                    : darkMode
                                      ? "bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-900"
                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] gap-4">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${modalLabelClasses}`}>Age</label>
                          <input
                            type="number"
                            value={tempAge === "" || tempAge === "Unknown" ? "" : tempAge}
                            onChange={(e) => setTempAge(e.target.value || "Unknown")}
                            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalInputClasses}`}
                            placeholder="Unknown"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${modalLabelClasses}`}>Gender</label>
                          <input
                            type="text"
                            value={tempGender}
                            onChange={(e) => setTempGender(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalInputClasses}`}
                            placeholder="Gender"
                          />
                        </div>
                      </div>
                    </div>

                    <div className={`${modalFieldCardClasses} p-5 space-y-4`}>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${modalLabelClasses}`}>Image</label>
                        <div
                          className={`relative aspect-square rounded-2xl overflow-hidden flex items-center justify-center ${
                            darkMode ? "bg-slate-900/60 border border-slate-700" : "bg-white border border-slate-200"
                          }`}
                        >
                          {data.image ? (
                            <>
                              <Image
                                src={data.image as string}
                                alt="Part"
                                width={320}
                                height={320}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => modalFileInputRef.current?.click()}
                                className="absolute inset-0 bg-slate-950/0 hover:bg-slate-950/50 transition-colors flex items-center justify-center"
                              >
                                <Upload className="w-7 h-7 text-white" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => modalFileInputRef.current?.click()}
                              className={`w-full h-full flex flex-col items-center justify-center gap-3 ${
                                darkMode ? "text-slate-300 hover:bg-slate-900/40" : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <SquareUserRound size={60} />
                              <span className="text-xs font-medium">Upload image</span>
                            </button>
                          )}
                          <input
                            ref={modalFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleModalImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`${modalFieldCardClasses} p-5 space-y-3`}>
                    <label className={`text-sm font-medium ${modalLabelClasses}`}>Description</label>
                    <textarea
                      value={tempScratchpad}
                      onChange={(e) => setTempScratchpad(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 min-h-[160px] resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalTextareaClasses}`}
                      placeholder="Add a description..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowInfoEditModal(false)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-900/60"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      saveInfo();
                      setTimeout(() => {
                        setShowInfoEditModal(false);
                      }, 0);
                    }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      darkMode
                        ? "bg-slate-100/15 text-white hover:bg-slate-100/25"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartDetailPanel;
