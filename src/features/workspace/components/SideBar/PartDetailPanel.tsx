"use client";

import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import Image from "next/image";
import { useThemeContext } from "@/state/context/ThemeContext";

// Helper to safely create CustomEvent
const createCustomEvent = (type: string, detail: any): Event | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Can't create events in SSR
    return null;
  }
  
  try {
    // Try using CustomEvent constructor
    if (typeof CustomEvent !== 'undefined' && typeof window.CustomEvent !== 'undefined') {
      return new window.CustomEvent(type, { detail });
    }
    // Fallback for older browsers
    if (typeof document.createEvent !== 'undefined') {
      const event = document.createEvent('CustomEvent');
      event.initCustomEvent(type, false, false, detail);
      return event;
    }
    // Final fallback
    if (typeof Event !== 'undefined') {
      const event = new Event(type);
      (event as any).detail = detail;
      return event;
    }
  } catch (error) {
    console.error('Failed to create custom event:', error);
  }
  return null;
};
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
  Trash2,
  History,
  Book,
  MessagesSquare
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
  const [windowWidth, setWindowWidth] = useState(0);
  
  const setShouldCollapseSidebar = useUIStore((s) => s.setShouldCollapseSidebar);
  const setJournalTarget = useJournalStore((s) => s.setJournalTarget);
  const { activeSidebarNode } = useSidebarStore();

  // Track window width for responsive positioning
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };
    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  const handleClose = () => {
    // Detach close behavior from options/sidebar completely
    setAddingImpressionType(null); // Close impression input if open
    setAddingNeedsOrFears(null); // Close needs/fears input if open
    setNeedsFearsInput(""); // Clear input
    setSelectedPartId(undefined);
  };
  // Use selective subscriptions - only subscribe to updateNode function, not nodes/edges arrays
  const { updateNode, deleteNode, deleteEdges, removePartFromAllTensions } = useFlowNodesContext();
  
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
  const [addingNeedsOrFears, setAddingNeedsOrFears] = useState<'needs' | 'fears' | null>(null);
  const [needsFearsInput, setNeedsFearsInput] = useState<string>("");
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
  const [showJournalHistoryModal, setShowJournalHistoryModal] = useState(false);

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
      // Fetch all journal entries with history
      const response = await fetch(`/api/journal/node/${selectedPartId}?history=true`);
      if (response.ok) {
        const data = await response.json();
        // Handle both single entry and entries array response formats
        const entries = data.entries || (data.id ? [data] : []);
        // Filter out empty entries
        const validEntries = entries.filter((entry: any) => 
          entry && entry.content && entry.content.trim().length > 0
        );
        setJournalEntries(validEntries);
      } else if (response.status === 404) {
        // No journal entries exist yet
        setJournalEntries([]);
      }
    } catch (error) {
      console.error("Failed to load journal entries:", error);
      setJournalEntries([]);
    } finally {
      setIsLoadingJournal(false);
    }
  };

  const deleteJournalEntry = async (entryId: string) => {
    if (!selectedPartId) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this journal entry?");
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/journal/node/${selectedPartId}?entryId=${entryId}`, {
        method: "DELETE",
      });
      
      if (response.ok || response.status === 204) {
        // Reload entries after deletion
        await loadJournalEntries();
      } else {
        alert("Failed to delete journal entry. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
      alert("Failed to delete journal entry. Please try again.");
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
      tension: "#c4a8e0",
      interaction: "#a8d4a8",
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
      
      // For tensions and interactions, get the connectedNodes data
      const nodeData = connectedNode?.data as any;
      const connectedNodes = nodeData?.connectedNodes || [];
      
      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        nodeDescription: (connectedNode?.data?.scratchpad as string) || (connectedNode?.data?.description as string) || "",
        relationshipType: edge.data?.relationshipType || "tension",
        connectedNodes: connectedNodes, // Include the parts and their statements
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
  } relative rounded-[28px] shadow-[0_24px_60px_rgba(15,23,42,0.28)] overflow-hidden w-full max-w-5xl max-h-[85vh] flex flex-col rounded-[10px]`;

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
    : "bg-white border border-slate-200 text-slate-900 markymark";

  const modalFieldCardClasses = darkMode
    ? "bg-slate-950/75 border border-slate-800/70 rounded-2xl"
    : "bg-slate-50 border border-slate-200 rounded-2xl";

  const modalInputClasses = darkMode
    ? "bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400 markymarkinput";

  const modalTextareaClasses = darkMode
    ? "bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border border-slate-200 text-slate-900 markymarktextarea placeholder-slate-400";

  const modalLabelClasses = darkMode ? "text-slate-200" : "text-slate-700";

  const handleDeletePart = () => {
    if (!selectedPartId) return;
    const confirmed = window.confirm("Delete this part and all related connections?");
    if (!confirmed) return;
    removePartFromAllTensions(selectedPartId);
    deleteEdges(selectedPartId);
    deleteNode(selectedPartId);
    setSelectedPartId(undefined);
  };

  const handleBackdropClick = () => {
    if (addingImpressionType) return;
    setSelectedPartId(undefined);
  };

  // Calculate positioning based on screen width
  // When >= 1400px, center the pane accounting for the 313px impression display
  // The impression display is at left-4 (16px) and is 313px wide = 329px total
  // We shift the pane right by half of that to center it in the remaining space
  const impressionDisplayWidth = 313;
  const impressionDisplayOffset = 16; // left-4 = 16px
  const impressionDisplayTotal = impressionDisplayWidth + impressionDisplayOffset;
  const shouldShiftForImpressionDisplay = windowWidth >= 1400;
  const shiftAmount = shouldShiftForImpressionDisplay ? impressionDisplayTotal / 2 : 0;

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative w-full max-w-5xl ${addingImpressionType ? `backdrop-blur-sm ${darkMode ? '' : 'bg-white'}` : ''}`}
        style={{
          transform: shiftAmount > 0 ? `translateX(${shiftAmount}px)` : 'none'
        }}
      >
        {/* Close Button - To the right of container, or above on smaller screens */}
        <button
          onClick={handleClose}
          className={`z-[60] hover:opacity-70 ${
            windowWidth < 1120 
              ? "absolute -top-12 left-1/2 -translate-x-1/2" 
              : "absolute -right-12 top-0"
          }`}
          aria-label="Close"
        >
          <X 
            className="text-white" 
            strokeWidth={2} 
            size={30} 
          />
        </button>

        <div
          className={`${containerClasses} relative`}
          onClick={(e) => e.stopPropagation()}
        >
        {addingImpressionType && (
          <div className="absolute inset-0 backdrop-blur-sm bg-white/10 dark:bg-slate-950/10 z-10 pointer-events-none" />
        )}
        {/* Content with TOC */}
        <div className={`flex flex-row flex-1 overflow-hidden min-h-0 ${addingImpressionType ? 'pointer-events-none' : ''}`}>
          {/* Table of Contents - Left Column */}
          {windowWidth >= 800 && (
          <div className={`w-52 flex-shrink-0 flex flex-col ${navContainerClasses}`}>
            <nav className="flex-1 overflow-y-auto px-5 py-5 space-y-2">
              <button
                onClick={() => scrollToSection(infoRef, 'info')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Info</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(insightsRef, 'insights')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" style={{ color: NodeBackgroundColors["thought"] }} />
                  <span>Insights</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(impressionsRef, 'impressions')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" style={{ color: NodeBackgroundColors["emotion"] }} />
                  <span>Impressions</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(journalRef, 'journal')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Journal</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(relationshipsRef, 'relationships')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm ${navButtonClasses}`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span>Relationships</span>
                </div>
              </button>
            </nav>
          </div>
          )}

          {/* Main Content - Right Column */}
          <div ref={scrollableContentRef} className={`${windowWidth < 800 ? 'w-full' : 'flex-1'} p-8 overflow-y-auto space-y-12 bg-transparent`}>

          {/* Info Section */}
          <div ref={infoRef} className="relative space-y-4">
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
                  disabled
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border cursor-not-allowed opacity-50 ${
                    darkMode
                      ? "border-slate-600/40 text-slate-400 bg-slate-950/30"
                      : "border-slate-300/50 text-slate-400 bg-slate-100/50"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-400"}`} />
                  <span>Deepen</span>
                </button>
                <button
                  onClick={handleDeletePart}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${
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
                        {(() => {
                          const currentType = tempPartType || (data.customPartType as string) || (data.partType as string) || "";
                          if (!currentType) {
                            return (
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize ${
                                darkMode
                                  ? "text-slate-300"
                                  : "text-slate-500"
                              }`}>
                                <User className="w-3.5 h-3.5" />
                                No type set
                              </span>
                            );
                          }
                          
                          const partTypeMapping: Record<string, { icon: React.ReactNode; className: string }> = {
                            manager: {
                              icon: <Brain className="w-3.5 h-3.5" />,
                              className: darkMode
                                ? "bg-sky-500/15 text-sky-100"
                                : "bg-sky-100 text-sky-600",
                            },
                            firefighter: {
                              icon: <Shield className="w-3.5 h-3.5" />,
                              className: darkMode
                                ? "bg-rose-500/15 text-rose-100"
                                : "bg-rose-100 text-rose-600",
                            },
                            exile: {
                              icon: <Heart className="w-3.5 h-3.5" />,
                              className: darkMode
                                ? "bg-purple-500/15 text-purple-100"
                                : "bg-purple-100 text-purple-600",
                            },
                          };

                          const pill = partTypeMapping[currentType] || {
                            icon: <User className="w-3.5 h-3.5" />,
                            className: darkMode
                              ? "bg-slate-800/60 text-slate-200"
                              : "bg-slate-100 text-slate-600",
                          };

                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize ${pill.className}`}
                            >
                              {pill.icon}
                              {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
                            </span>
                          );
                        })()}
                        {/* Age and Gender Display - To the right of part type */}
                        {((data.age as string) && (data.age as string).toLowerCase() !== "unknown") || 
                         ((data.gender as string) && (data.gender as string).toLowerCase() !== "unknown") ? (
                          <>
                            {(data.age as string) && (data.age as string).toLowerCase() !== "unknown" && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}>
                                {data.age as string}
                              </span>
                            )}
                            {(data.gender as string) && (data.gender as string).toLowerCase() !== "unknown" && (
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
          <div ref={insightsRef} className="relative space-y-4">
            <h4 className={`text-[11px] font-semibold uppercase tracking-[0.32em] flex items-center gap-2 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <Brain className="w-3 h-3" style={{ color: NodeBackgroundColors["thought"] }} />
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
                        setAddingNeedsOrFears('needs');
                        setNeedsFearsInput("");
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
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
                          className="opacity-0 group-hover:opacity-100 p-1"
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
                        setAddingNeedsOrFears('fears');
                        setNeedsFearsInput("");
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
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
                          className="opacity-0 group-hover:opacity-100 p-1"
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
          <div ref={impressionsRef} className="relative space-y-4">
            <h3 className={`text-[11px] font-semibold uppercase tracking-[0.32em] flex items-center gap-2 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <Eye className="w-3 h-3" style={{ color: NodeBackgroundColors["emotion"] }} />
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
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
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
                          {impressions.length > 0 ? (
                            impressions.map((imp, index) => {
                              const accent = NodeBackgroundColors[impression];
                              const accentText = NodeTextColors[impression] || accent;
                              const chipBackground = toRgba(accent, darkMode ? 0.45 : 0.24);
                              const chipBorder = toRgba(accent, darkMode ? 0.65 : 0.32);
                              const iconColor = darkMode ? "rgba(255,255,255,0.75)" : accentText;

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
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={() => handleReturnToSidebar(impression, imp.id)}
                                      className="p-1"
                                      style={{
                                        color: iconColor,
                                      }}
                                      title="Return to sidebar"
                                    >
                                      <ListRestart size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveImpression(impression, imp.id)}
                                      className="p-1"
                                      style={{
                                        color: iconColor,
                                      }}
                                      title="Delete"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div
                              className={`rounded-xl border px-3 py-2 ${darkMode ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/50 bg-slate-50/50"}`}
                            >
                              <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
                                No {impression} impressions
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Journal History Section */}
          <div ref={journalRef} className="relative space-y-4">
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                  darkMode
                    ? "bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-600"
                    : "bg-slate-700 text-white hover:bg-slate-800 border border-slate-600"
                }`}
              >
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {journalEntries.length} {journalEntries.length === 1 ? "entry" : "entries"}
                    </span>
                    <button
                      onClick={() => setShowJournalHistoryModal(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        darkMode
                          ? "border border-slate-700 text-slate-200 hover:bg-slate-800/60"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View All</span>
                    </button>
                  </div>
                  {/* Show only the 3 most recent entries */}
                  <div className="space-y-3">
                  {journalEntries.map((entry) => {
                    // Determine if it's a text thread
                    const isTextThread = (() => {
                      try {
                        const parsed = JSON.parse(entry.content);
                        return Array.isArray(parsed);
                      } catch {
                        return false;
                      }
                    })();

                    // Get speaker names for display
                    const speakerNames = (() => {
                      if (!entry.speakers || entry.speakers.length === 0) return [];
                      return entry.speakers.map((speakerId: string) => {
                        if (speakerId === "self") return "Self";
                        if (speakerId === "unknown" || speakerId === "?") return "Unknown";
                        // Try to find the part node
                        const partNode = nodes.find(n => n.id === speakerId);
                        return partNode?.data?.label || partNode?.data?.name || speakerId;
                      });
                    })();

                    // Check if entry was updated (different from created)
                    const wasUpdated = entry.updatedAt && entry.createdAt && 
                      new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime();

                    // Get content preview
                    const contentPreview = (() => {
                      if (isTextThread) {
                        try {
                          const parsed = JSON.parse(entry.content);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            // Get part nodes for speaker name resolution
                            const partNodesMap = new Map(nodes.filter(n => n.type === "part").map(n => [n.id, n]));
                            
                            return parsed.slice(0, 8).map((msg: any) => {
                              let speakerLabel = "Unknown";
                              if (msg.speakerId === "self") {
                                speakerLabel = "Self";
                              } else if (msg.speakerId === "unknown" || msg.speakerId === "?") {
                                speakerLabel = "Unknown";
                              } else {
                                const partNode = partNodesMap.get(msg.speakerId);
                                speakerLabel = partNode?.data?.label || partNode?.data?.name || msg.speakerId;
                              }
                              return `${speakerLabel}: ${msg.text || ""}`;
                            }).join("\n") + (parsed.length > 8 ? `\n... (${parsed.length - 8} more messages)` : "");
                          }
                        } catch {
                          // Fall through to regular content
                        }
                      }
                      // Regular content - extract plain text from HTML and show first 500 chars
                      let text = entry.content || "";
                      // Remove HTML tags and extract plain text
                      if (typeof window !== "undefined") {
                        const temp = document.createElement("div");
                        temp.innerHTML = text;
                        text = (temp.textContent || temp.innerText || "").trim();
                      } else {
                        // Server-side fallback
                        text = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                      }
                      return text.length > 500 ? text.substring(0, 500) + "..." : text;
                    })();

                    // Get word/character count
                    const wordCount = isTextThread ? 
                      (() => {
                        try {
                          const parsed = JSON.parse(entry.content);
                          if (Array.isArray(parsed)) {
                            return parsed.reduce((acc: number, msg: any) => {
                              return acc + (msg.text || "").split(/\s+/).filter((w: string) => w.length > 0).length;
                            }, 0);
                          }
                        } catch {}
                        return 0;
                      })() :
                      (entry.content || "").split(/\s+/).filter(w => w.length > 0).length;
                    const charCount = entry.content?.length || 0;

                    return (
                      <div key={entry.id} className={`${subCardClasses} p-5 shadow-sm hover:shadow-md transition-shadow`}>
                        {/* Header with dates and actions */}
                        <div className="flex items-start justify-between mb-3 gap-4">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Clock className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                              <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                Created: {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {wasUpdated && (
                                <>
                                  <span className={darkMode ? "text-slate-600" : "text-slate-400"}>•</span>
                                  <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                    Updated: {new Date(entry.updatedAt).toLocaleDateString()} at {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Entry type and metadata */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                                isTextThread
                                  ? darkMode
                                    ? "bg-purple-900/40 text-purple-200 border border-purple-700/50"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                  : darkMode
                                    ? "bg-blue-900/40 text-blue-200 border border-blue-700/50"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {isTextThread ? (
                                  <>
                                    <MessagesSquare className="w-3 h-3" />
                                    Text Thread
                                  </>
                                ) : (
                                  <>
                                    <Book className="w-3 h-3" />
                                    Journal
                                  </>
                                )}
                              </span>
                              
                              {speakerNames.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                    Speakers:
                                  </span>
                                  {speakerNames.map((name, idx) => (
                                    <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                                      darkMode
                                        ? "bg-slate-800/60 text-slate-300"
                                        : "bg-slate-100 text-slate-600"
                                    }`}>
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                {wordCount} words • {charCount.toLocaleString()} chars
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => {
                                // Open this entry in the main journal drawer
                                if (selectedPartId && partNode) {
                                  // Detect mode from content
                                  const detectMode = (content: string): "normal" | "textThread" => {
                                    if (!content) return "normal";
                                    try {
                                      const parsed = JSON.parse(content);
                                      if (Array.isArray(parsed)) {
                                        return "textThread";
                                      }
                                    } catch {
                                      // Not JSON, assume normal journal
                                    }
                                    return "normal";
                                  };
                                  
                                  const mode = detectMode(entry.content);
                                  
                                  setJournalTarget({
                                    type: "node",
                                    nodeId: selectedPartId,
                                    nodeType: "part",
                                    title: partNode.data?.label || "Part",
                                  });
                                  
                                  // Set mode and load entry - we need to trigger this after the drawer opens
                                  setTimeout(() => {
                                    if (typeof window === 'undefined') return;
                                    
                                    const store = useJournalStore.getState();
                                    store.loadEntry({
                                      entryId: entry.id,
                                      content: entry.content,
                                      speakers: Array.isArray(entry.speakers) ? entry.speakers : [],
                                    });
                                    
                                    // Dispatch a custom event to set the mode
                                    try {
                                      const event = createCustomEvent('journal-set-mode', { mode });
                                      if (event && typeof window !== 'undefined') {
                                        window.dispatchEvent(event);
                                      }
                                    } catch (error) {
                                      console.error('Failed to dispatch journal-set-mode event:', error);
                                    }
                                  }, 100);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                                darkMode
                                  ? "bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                              title="Open in journal"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Open</span>
                            </button>
                            <button
                              onClick={() => extractImpressionsFromEntry(entry.id)}
                              disabled={true}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed opacity-50 ${
                                darkMode
                                  ? "bg-slate-800 text-slate-500"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                              title="Coming soon"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Extract</span>
                            </button>
                            <button
                              onClick={() => deleteJournalEntry(entry.id)}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                                darkMode
                                  ? "text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                                  : "text-slate-500 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Content Preview */}
                        <div className={`whitespace-pre-wrap text-sm leading-relaxed max-h-64 overflow-y-auto ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}>
                          {contentPreview}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Relationships Section */}
          <div ref={relationshipsRef} className="relative space-y-4">
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
                    const connectedNodes = (rel as any).connectedNodes || [];

                    return (
                      <div key={rel.id} className={`${subCardClasses} p-5 shadow-sm`}>
                        <div
                          className={`rounded-2xl border p-4 ${
                            isTension
                              ? darkMode
                                ? "border-purple-500/40 bg-purple-900/25"
                                : "border-purple-300/70 bg-purple-50/70"
                              : isInteraction
                                ? darkMode
                                  ? "border-sky-500/40 bg-sky-900/25"
                                  : "border-sky-300/70 bg-sky-50/70"
                                : darkMode
                                  ? "border-slate-700 bg-slate-900/40"
                                  : "border-slate-200 bg-white"
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-1">
                              <div
                                className={`text-sm font-semibold ${
                                  isTension
                                    ? darkMode
                                      ? "text-purple-100"
                                      : "text-purple-900"
                                    : isInteraction
                                      ? darkMode
                                        ? "text-sky-100"
                                        : "text-sky-900"
                                      : darkMode
                                        ? "text-slate-100"
                                        : "text-slate-900"
                                }`}
                              >
                                {rel.nodeLabel}
                              </div>
                              {rel.nodeDescription && String(rel.nodeDescription).trim() ? (
                                <div
                                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                    isTension
                                      ? darkMode
                                        ? "text-purple-200"
                                        : "text-purple-700"
                                      : isInteraction
                                        ? darkMode
                                          ? "text-sky-200"
                                          : "text-sky-700"
                                        : darkMode
                                          ? "text-slate-300"
                                          : "text-slate-700"
                                  }`}
                                >
                                  {String(rel.nodeDescription)}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* Display parts involved and their messages */}
                          {connectedNodes.length > 0 && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {connectedNodes.map((connectedNode: any, index: number) => {
                                const part = connectedNode?.part;
                                const statement = connectedNode?.tensionDescription || "";
                                if (!part) return null;

                                return (
                                  <div
                                    key={index}
                                    className="rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/40 px-3 py-2.5 shadow-sm hover:shadow-md transition"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div
                                        className={`text-sm font-semibold ${
                                          darkMode ? "text-slate-50" : "text-slate-900"
                                        }`}
                                      >
                                        {part?.data?.label || part?.data?.name || "Unknown Part"}
                                      </div>
                                    </div>
                                    {statement && (
                                      <div
                                    className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                          darkMode ? "text-slate-200" : "text-slate-700"
                                        }`}
                                      >
                                        {statement}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
            className="fixed inset-0 z-[55] flex items-center justify-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setAddingImpressionType(null);
              }
            }}
          >
            <div
              className={`fixed inset-0 pointer-events-none ${
                darkMode ? "bg-slate-950/30" : "bg-slate-900/20"
              }`}
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
                      className={`h-10 w-10 flex items-center justify-center rounded-full border ${
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

        {/* Needs/Fears Input Modal */}
        {addingNeedsOrFears && (
          <div
            className="fixed inset-0 z-[55] flex items-center justify-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setAddingNeedsOrFears(null);
                setNeedsFearsInput("");
              }
            }}
          >
            <div
              className={`fixed inset-0 pointer-events-none ${
                darkMode ? "bg-slate-950/30" : "bg-slate-900/20"
              }`}
            />
            <div
              className="relative w-full max-w-2xl"
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
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] ${
                          addingNeedsOrFears === 'needs'
                            ? darkMode
                              ? "bg-emerald-900/40 text-emerald-200 border border-emerald-700/50"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : darkMode
                              ? "bg-rose-900/40 text-rose-200 border border-rose-700/50"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {addingNeedsOrFears === 'needs' ? <Heart size={14} /> : <Shield size={14} />}
                        {addingNeedsOrFears === 'needs' ? 'Need' : 'Fear'}
                      </span>
                      <div>
                        <h3
                          className={`text-2xl font-semibold ${
                            darkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Add a new {addingNeedsOrFears === 'needs' ? 'need' : 'fear'} to {(data.name as string) || (data.label as string) || "this part"}
                        </h3>
                        <p
                          className={`mt-2 text-sm leading-relaxed ${
                            darkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {addingNeedsOrFears === 'needs' 
                            ? "What does this part need to feel safe, heard, or supported?"
                            : "What does this part fear might happen?"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAddingNeedsOrFears(null);
                        setNeedsFearsInput("");
                      }}
                      className={`h-10 w-10 flex items-center justify-center rounded-full border ${
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
                    className={`rounded-2xl border px-6 py-6 shadow-inner ${
                      addingNeedsOrFears === 'needs'
                        ? darkMode
                          ? "border-emerald-700/50 bg-emerald-900/20"
                          : "border-emerald-200 bg-emerald-50/50"
                        : darkMode
                          ? "border-rose-700/50 bg-rose-900/20"
                          : "border-rose-200 bg-rose-50/50"
                    }`}
                  >
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.focus();
                          // Auto-resize textarea
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                      value={needsFearsInput}
                      onChange={(e) => {
                        setNeedsFearsInput(e.target.value);
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && needsFearsInput.trim()) {
                          e.preventDefault();
                          addListItem(addingNeedsOrFears, needsFearsInput.trim());
                          setNeedsFearsInput("");
                          setAddingNeedsOrFears(null);
                        }
                        if (e.key === 'Escape') {
                          setAddingNeedsOrFears(null);
                          setNeedsFearsInput("");
                        }
                      }}
                      placeholder={`Describe ${addingNeedsOrFears === 'needs' ? 'what this part needs' : 'what this part fears'}...`}
                      className={`w-full min-h-[120px] resize-none rounded-xl px-5 py-4 text-sm leading-relaxed focus:outline-none focus:ring-0 border-transparent ${
                        addingNeedsOrFears === 'needs'
                          ? darkMode
                            ? "bg-emerald-900/20 text-white placeholder-emerald-300/50"
                            : "bg-emerald-50/50 text-slate-900 placeholder-slate-400"
                          : darkMode
                            ? "bg-rose-900/20 text-white placeholder-rose-300/50"
                            : "bg-rose-50/50 text-slate-900 placeholder-slate-400"
                      }`}
                      rows={4}
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          if (needsFearsInput.trim()) {
                            addListItem(addingNeedsOrFears, needsFearsInput.trim());
                            setNeedsFearsInput("");
                            setAddingNeedsOrFears(null);
                          }
                        }}
                        disabled={!needsFearsInput.trim()}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          addingNeedsOrFears === 'needs'
                            ? darkMode
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-900/50 disabled:text-emerald-400/50"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-200 disabled:text-emerald-400"
                            : darkMode
                              ? "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-900/50 disabled:text-rose-400/50"
                              : "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-200 disabled:text-rose-400"
                        }`}
                      >
                        Add {addingNeedsOrFears === 'needs' ? 'Need' : 'Fear'}
                      </button>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 flex-wrap ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <div className="flex items-center gap-1.5">
                      <kbd className={`px-2 py-1 rounded text-[10px] font-semibold ${
                        darkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-700"
                      }`}>
                        Enter
                      </kbd>
                      <span className="text-xs">Submit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className={`px-2 py-1 rounded text-[10px] font-semibold ${
                        darkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-700"
                      }`}>
                        Esc
                      </kbd>
                      <span className="text-xs">Cancel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Journal History Modal */}
        {showJournalHistoryModal && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4"
            onClick={() => setShowJournalHistoryModal(false)}
          >
            <div
              className={`${modalContainerClasses} rounded-[24px] shadow-[0_20px_48px_rgba(15,23,42,0.26)] w-full max-w-4xl max-h-[85vh] mx-4 overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                    Journal History
                  </h3>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {journalEntries.length} {journalEntries.length === 1 ? "entry" : "entries"} for {(data.name as string) || (data.label as string) || "this part"}
                  </p>
                </div>
                <button
                  onClick={() => setShowJournalHistoryModal(false)}
                  className={`p-2 rounded-full border ${
                    darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-900/60" : "border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  {journalEntries.map((entry) => {
                    // Determine if it's a text thread
                    const isTextThread = (() => {
                      try {
                        const parsed = JSON.parse(entry.content);
                        return Array.isArray(parsed);
                      } catch {
                        return false;
                      }
                    })();

                    // Get speaker names for display
                    const speakerNames = (() => {
                      if (!entry.speakers || entry.speakers.length === 0) return [];
                      return entry.speakers.map((speakerId: string) => {
                        if (speakerId === "self") return "Self";
                        if (speakerId === "unknown" || speakerId === "?") return "Unknown";
                        // Try to find the part node
                        const partNode = nodes.find(n => n.id === speakerId);
                        return partNode?.data?.label || partNode?.data?.name || speakerId;
                      });
                    })();

                    // Check if entry was updated (different from created)
                    const wasUpdated = entry.updatedAt && entry.createdAt && 
                      new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime();

                    // Get content preview
                    const contentPreview = (() => {
                      if (isTextThread) {
                        try {
                          const parsed = JSON.parse(entry.content);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            // Get part nodes for speaker name resolution
                            const partNodesMap = new Map(nodes.filter(n => n.type === "part").map(n => [n.id, n]));
                            
                            return parsed.slice(0, 8).map((msg: any) => {
                              let speakerLabel = "Unknown";
                              if (msg.speakerId === "self") {
                                speakerLabel = "Self";
                              } else if (msg.speakerId === "unknown" || msg.speakerId === "?") {
                                speakerLabel = "Unknown";
                              } else {
                                const partNode = partNodesMap.get(msg.speakerId);
                                speakerLabel = partNode?.data?.label || partNode?.data?.name || msg.speakerId;
                              }
                              return `${speakerLabel}: ${msg.text || ""}`;
                            }).join("\n") + (parsed.length > 8 ? `\n... (${parsed.length - 8} more messages)` : "");
                          }
                        } catch {
                          // Fall through to regular content
                        }
                      }
                      // Regular content - extract plain text from HTML and show first 500 chars
                      let text = entry.content || "";
                      // Remove HTML tags and extract plain text
                      if (typeof window !== "undefined") {
                        const temp = document.createElement("div");
                        temp.innerHTML = text;
                        text = (temp.textContent || temp.innerText || "").trim();
                      } else {
                        // Server-side fallback
                        text = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                      }
                      return text.length > 500 ? text.substring(0, 500) + "..." : text;
                    })();

                    // Get word/character count
                    const wordCount = isTextThread ? 
                      (() => {
                        try {
                          const parsed = JSON.parse(entry.content);
                          if (Array.isArray(parsed)) {
                            return parsed.reduce((acc: number, msg: any) => {
                              return acc + (msg.text || "").split(/\s+/).filter((w: string) => w.length > 0).length;
                            }, 0);
                          }
                        } catch {}
                        return 0;
                      })() :
                      (entry.content || "").split(/\s+/).filter(w => w.length > 0).length;
                    const charCount = entry.content?.length || 0;

                    return (
                      <div key={entry.id} className={`${subCardClasses} p-5 shadow-sm hover:shadow-md transition-shadow`}>
                        {/* Header with dates and actions */}
                        <div className="flex items-start justify-between mb-3 gap-4">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Clock className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                              <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                Created: {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {wasUpdated && (
                                <>
                                  <span className={darkMode ? "text-slate-600" : "text-slate-400"}>•</span>
                                  <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                    Updated: {new Date(entry.updatedAt).toLocaleDateString()} at {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Entry type and metadata */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                                isTextThread
                                  ? darkMode
                                    ? "bg-purple-900/40 text-purple-200 border border-purple-700/50"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                  : darkMode
                                    ? "bg-blue-900/40 text-blue-200 border border-blue-700/50"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {isTextThread ? (
                                  <>
                                    <MessagesSquare className="w-3 h-3" />
                                    Text Thread
                                  </>
                                ) : (
                                  <>
                                    <Book className="w-3 h-3" />
                                    Journal
                                  </>
                                )}
                              </span>
                              
                              {speakerNames.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                    Speakers:
                                  </span>
                                  {speakerNames.map((name, idx) => (
                                    <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                                      darkMode
                                        ? "bg-slate-800/60 text-slate-300"
                                        : "bg-slate-100 text-slate-600"
                                    }`}>
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                {wordCount} words • {charCount.toLocaleString()} chars
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => {
                                // Open this entry in the main journal drawer
                                if (selectedPartId && partNode) {
                                  // Detect mode from content
                                  const detectMode = (content: string): "normal" | "textThread" => {
                                    if (!content) return "normal";
                                    try {
                                      const parsed = JSON.parse(content);
                                      if (Array.isArray(parsed)) {
                                        return "textThread";
                                      }
                                    } catch {
                                      // Not JSON, assume normal journal
                                    }
                                    return "normal";
                                  };
                                  
                                  const mode = detectMode(entry.content);
                                  
                                  setJournalTarget({
                                    type: "node",
                                    nodeId: selectedPartId,
                                    nodeType: "part",
                                    title: partNode.data?.label || "Part",
                                  });
                                  
                                  // Set mode and load entry - we need to trigger this after the drawer opens
                                  setTimeout(() => {
                                    if (typeof window === 'undefined') return;
                                    
                                    const store = useJournalStore.getState();
                                    store.loadEntry({
                                      entryId: entry.id,
                                      content: entry.content,
                                      speakers: Array.isArray(entry.speakers) ? entry.speakers : [],
                                    });
                                    
                                    // Dispatch a custom event to set the mode
                                    try {
                                      const event = createCustomEvent('journal-set-mode', { mode });
                                      if (event && typeof window !== 'undefined') {
                                        window.dispatchEvent(event);
                                      }
                                    } catch (error) {
                                      console.error('Failed to dispatch journal-set-mode event:', error);
                                    }
                                  }, 100);
                                  
                                  setShowJournalHistoryModal(false);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                                darkMode
                                  ? "bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                              title="Open in journal"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Open</span>
                            </button>
                            <button
                              onClick={() => extractImpressionsFromEntry(entry.id)}
                              disabled={true}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed opacity-50 ${
                                darkMode
                                  ? "bg-slate-800 text-slate-500"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                              title="Coming soon"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Extract</span>
                            </button>
                            <button
                              onClick={() => deleteJournalEntry(entry.id)}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                                darkMode
                                  ? "text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                                  : "text-slate-500 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Content Preview */}
                        <div className={`whitespace-pre-wrap text-sm leading-relaxed max-h-64 overflow-y-auto ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}>
                          {contentPreview}
                        </div>
                      </div>
                    );
                  })}
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
                    className={`p-2 rounded-full border ${
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
                                className={`px-3.5 py-2 rounded-full text-xs font-semibold ${
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
                                className="absolute inset-0 bg-slate-950/0 hover:bg-slate-950/50 flex items-center justify-center"
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
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border ${
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
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold ${
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
