"use client";

import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import Image from "next/image";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";

// Helper to safely create CustomEvent
const createCustomEvent = (type: string, detail: any): Event | null => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    // Can't create events in SSR
    return null;
  }

  try {
    // Try using CustomEvent constructor
    if (
      typeof CustomEvent !== "undefined" &&
      typeof window.CustomEvent !== "undefined"
    ) {
      return new window.CustomEvent(type, { detail });
    }
    // Fallback for older browsers
    if (typeof document.createEvent !== "undefined") {
      const event = document.createEvent("CustomEvent");
      event.initCustomEvent(type, false, false, detail);
      return event;
    }
    // Final fallback
    if (typeof Event !== "undefined") {
      const event = new Event(type);
      (event as any).detail = detail;
      return event;
    }
  } catch (error) {
    console.error("Failed to create custom event:", error);
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
  Check,
  Trash2,
  History,
  Book,
  MessagesSquare,
  Sword,
} from "lucide-react";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import {
  ImpressionTextType,
  ImpressionType,
} from "@/features/workspace/types/Impressions";
import { ImpressionNode } from "@/features/workspace/types/Nodes";
import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import ImpressionInput from "./Impressions/ImpressionInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSidebarStore } from "@/features/workspace/state/stores/Sidebar";

// Helper to detect if user is on Mac
const isMac = () => {
  if (typeof window === "undefined") return false;
  return (
    /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
  );
};

const PartDetailPanel = () => {
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
  const shouldAutoEditPart = useUIStore((s) => s.shouldAutoEditPart);
  const setShouldAutoEditPart = useUIStore((s) => s.setShouldAutoEditPart);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const setShouldCollapseSidebar = useUIStore(
    (s) => s.setShouldCollapseSidebar
  );
  const setJournalTarget = useJournalStore((s) => s.setJournalTarget);
  const journalIsOpen = useJournalStore((s) => s.isOpen);
  const journalLastSaved = useJournalStore((s) => s.lastSavedJournalData);
  const { activeSidebarNode } = useSidebarStore();

  // Track window width for responsive positioning
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };
    updateWindowWidth();
    window.addEventListener("resize", updateWindowWidth);
    return () => window.removeEventListener("resize", updateWindowWidth);
  }, []);

  const handleClose = () => {
    // Detach close behavior from options/sidebar completely
    setShowImpressionModal(false); // Close impression input if open
    setAddingNeedsOrFears(null); // Close needs/fears input if open
    setNeedsFearsInput(""); // Clear input
    setSelectedPartId(undefined);
  };
  // Use selective subscriptions - only subscribe to updateNode function, not nodes/edges arrays
  const {
    updateNode,
    updatePartName,
    deleteNode,
    deleteEdges,
    removePartFromAllTensions,
  } = useFlowNodesContext();

  // Get nodes and edges from store - Zustand handles this efficiently
  const nodes = useWorkingStore((s) => s.nodes);
  const edges = useWorkingStore((s) => s.edges);

  // Use useMemo to compute derived values to prevent infinite loops
  const partNode = useMemo(() => {
    if (!selectedPartId) return null;
    return nodes.find((node) => node.id === selectedPartId) || null;
  }, [selectedPartId, nodes]);

  const relatedEdges = useMemo(() => {
    if (!selectedPartId) return [];
    return edges.filter(
      (edge) => edge.source === selectedPartId || edge.target === selectedPartId
    );
  }, [selectedPartId, edges]);
  const theme = useTheme();

  const toRgba = (hex: string, opacity: number) => {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const setImpressionModalTarget = useUIStore(
    (s) => s.setImpressionModalTarget
  );
  const [addingNeedsOrFears, setAddingNeedsOrFears] = useState<
    "needs" | "fears" | null
  >(null);
  const [needsFearsInput, setNeedsFearsInput] = useState<string>("");
  const [editingAge, setEditingAge] = useState(false);
  const [editingGender, setEditingGender] = useState(false);
  const [editingPartType, setEditingPartType] = useState(false);
  const [tempAge, setTempAge] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempPartType, setTempPartType] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempScratchpad, setTempScratchpad] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const scrollToSection = (
    sectionRef: React.RefObject<HTMLDivElement | null>,
    sectionId: string
  ) => {
    if (sectionRef.current && scrollableContentRef.current) {
      const container = scrollableContentRef.current;
      const sectionElement = sectionRef.current;
      const containerRect = container.getBoundingClientRect();
      const sectionRect = sectionElement.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const offsetTop = scrollTop + (sectionRect.top - containerRect.top) - 20; // 20px padding from top
      container.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  // Journal state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  const [isLoadingJournal, setIsLoadingJournal] = useState(false);
  const [isExtractingImpressions, setIsExtractingImpressions] = useState(false);
  const [showJournalHistoryModal, setShowJournalHistoryModal] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [hoveredPartType, setHoveredPartType] = useState<string | null>(null);

  // Load journal entries when part is selected
  useEffect(() => {
    if (selectedPartId) {
      loadJournalEntries();
    }
  }, [selectedPartId]);

  // Refresh journal entries after closing the journal drawer (e.g., after saving)
  useEffect(() => {
    if (!journalIsOpen && selectedPartId) {
      loadJournalEntries();
    }
  }, [journalIsOpen, journalLastSaved, selectedPartId]);

  // Initialize temp values from part data when part changes (only on selection change, not on every render)
  useEffect(() => {
    if (partNode && selectedPartId) {
      const data = partNode.data;
      const name = (data.name as string) || (data.label as string) || "";
      setTempName(name);
      setTempScratchpad((data.scratchpad as string) || "");
      setTempPartType(
        (data.customPartType as string) || (data.partType as string) || ""
      );
      setTempAge((data.age as string) || "Unknown");
      setTempGender((data.gender as string) || "");
      setActiveSection("info"); // Reset to top section when part changes
    }
  }, [selectedPartId, partNode]); // Only sync when selectedPartId or partNode changes

  // Cleanup hover timeout when editing mode changes or component unmounts

  // Separate effect to handle auto-edit flag when part is selected
  useEffect(() => {
    if (partNode && selectedPartId && shouldAutoEditPart) {
      // Enable edit mode and reset flag
      // Use a small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        setIsEditingInfo(true);
        setShouldAutoEditPart(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedPartId, partNode, shouldAutoEditPart, setShouldAutoEditPart]);

  const loadJournalEntries = async () => {
    if (!selectedPartId) return;

    setIsLoadingJournal(true);
    try {
      // Fetch all journal entries with history
      const response = await fetch(
        `/api/journal/node/${selectedPartId}?history=true`
      );
      if (response.ok) {
        const data = await response.json();
        // Handle both single entry and entries array response formats
        const entries = data.entries || (data.id ? [data] : []);
        // Filter out empty entries
        const validEntries = entries.filter(
          (entry: any) =>
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

    const confirmed = window.confirm(
      "Are you sure you want to delete this journal entry?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/journal/node/${selectedPartId}?entryId=${entryId}`,
        {
          method: "DELETE",
        }
      );

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
      const response = await fetch(
        `/api/journal/node/${selectedPartId}/extract-impressions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nodeId: selectedPartId,
            journalEntryId: entryId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Impressions extracted:", result);

        // Add the extracted impressions to the part node's data
        if (result.impressions && result.impressions.length > 0 && partNode) {
          const updatedData = { ...partNode.data };

          // Group impressions by type and add them to the appropriate buckets
          result.impressions.forEach((impression: any) => {
            const type = impression.type;
            const impressionTypeKey =
              ImpressionTextType[type as keyof typeof ImpressionTextType];

            if (impressionTypeKey) {
              const currentImpressions =
                (updatedData[impressionTypeKey] as ImpressionNode[]) || [];
              const newImpression: ImpressionNode = {
                id: impression.id,
                type: type,
                data: {
                  label: impression.label,
                  addedAt: Date.now(),
                },
                position: { x: 0, y: 0 },
              };

              updatedData[impressionTypeKey] = [
                ...currentImpressions,
                newImpression,
              ];
            }
          });

          // Update the part node with the new impressions
          updateNode(selectedPartId, {
            data: updatedData,
          });

          console.log(
            `Successfully added ${result.impressions.length} impressions to the part!`
          );
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

  const handleRemoveImpression = (
    impressionType: string,
    impressionId: string
  ) => {
    if (!selectedPartId || !partNode) return;

    const currentImpressions =
      (partNode.data[
        ImpressionTextType[impressionType as keyof typeof ImpressionTextType]
      ] as ImpressionNode[]) || [];
    const filteredImpressions = currentImpressions.filter(
      (imp) => imp.id !== impressionId
    );

    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [ImpressionTextType[impressionType as keyof typeof ImpressionTextType]]:
          filteredImpressions,
      },
    });
  };

  const handleDropImpression = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedPartId || !partNode) return;

    // Get impression data from sidebar store or dataTransfer
    let impressionData: {
      id: string;
      type: ImpressionType;
      label: string;
    } | null = null;

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
          const parsed = JSON.parse(data) as {
            type: ImpressionType;
            id: string;
          };
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
    const impressionTypeKey =
      ImpressionTextType[
        impressionData.type as keyof typeof ImpressionTextType
      ];
    const currentImpressions =
      (partNode.data[impressionTypeKey] as ImpressionNode[]) || [];

    // Check if impression already exists
    if (currentImpressions.find((imp) => imp.id === impressionData.id)) {
      return; // Already exists
    }

    const newImpression: ImpressionNode = {
      id: impressionData.id,
      type: impressionData.type,
      data: {
        label: impressionData.label,
        addedAt: Date.now(),
      },
      position: { x: 0, y: 0 },
    };

    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [impressionTypeKey]: [...currentImpressions, newImpression],
      },
    });

    // Remove from sidebar
    useWorkingStore
      .getState()
      .removeImpression({ type: impressionData.type, id: impressionData.id });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleReturnToSidebar = (
    impressionType: string,
    impressionId: string
  ) => {
    if (!selectedPartId || !partNode) return;

    const currentImpressions =
      (partNode.data[
        ImpressionTextType[impressionType as keyof typeof ImpressionTextType]
      ] as ImpressionNode[]) || [];
    const impressionToReturn = currentImpressions.find(
      (imp) => imp.id === impressionId
    );
    const filteredImpressions = currentImpressions.filter(
      (imp) => imp.id !== impressionId
    );

    // Remove from part
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [ImpressionTextType[impressionType as keyof typeof ImpressionTextType]]:
          filteredImpressions,
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

  // Calculate relationships from the related edges and nodes
  const relationships = useMemo(() => {
    if (!selectedPartId || !relatedEdges.length) return [];

    return relatedEdges.map((edge) => {
      const connectedNodeId =
        edge.source === selectedPartId ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);

      // For tensions and interactions, get the connectedNodes data
      const nodeData = connectedNode?.data as any;
      const connectedNodesRaw = nodeData?.connectedNodes || [];
      // Rehydrate parts so names/types stay in sync with latest node state
      const connectedNodes = connectedNodesRaw.map((cn: any) => {
        const latestPart = nodes.find((n) => n.id === cn?.part?.id);
        return {
          ...cn,
          part: latestPart || cn.part,
        };
      });

      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        nodeDescription:
          (connectedNode?.data?.scratchpad as string) ||
          (connectedNode?.data?.description as string) ||
          "",
        relationshipType: edge.data?.relationshipType || "tension",
        connectedNodes: connectedNodes, // Include the parts and their statements
      };
    });
  }, [relatedEdges, nodes, selectedPartId]);

  const addListItem = (field: string, newItem: string) => {
    if (!selectedPartId || !partNode || newItem.trim() === "") return;

    const currentList =
      (partNode.data[field as keyof typeof partNode.data] as string[]) || [];
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [field]: [...currentList, newItem.trim()],
      },
    });
  };

  const removeListItem = (field: string, index: number) => {
    if (!selectedPartId || !partNode) return;

    const currentList =
      (partNode.data[field as keyof typeof partNode.data] as string[]) || [];
    const newList = currentList.filter((_, i) => i !== index);

    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [field]: newList,
      },
    });
  };

  const saveAllInfo = () => {
    if (!selectedPartId || !partNode) return;

    const trimmedName = tempName.trim();
    const trimmedScratchpad = tempScratchpad.trim();
    const trimmedAge =
      tempAge === "" || tempAge === "Unknown" ? "" : tempAge.trim();
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
          partType: tempPartType || undefined,
          age: trimmedAge || undefined,
          gender: trimmedGender || undefined,
        },
      });

      // Update part name separately if it changed
      if (
        trimmedName !==
        ((partNode.data.name as string) ||
          (partNode.data.label as string) ||
          "")
      ) {
        updatePartName(selectedPartId, trimmedName);
      }

      setTempName(trimmedName);
      setTempScratchpad(trimmedScratchpad);
      setTempAge(trimmedAge || "Unknown");
      setTempGender(trimmedGender);
    });

    setIsEditingInfo(false);
  };

  const saveInfo = () => {
    if (!selectedPartId || !partNode) return;
    const trimmedName = tempName.trim();
    const trimmedScratchpad = tempScratchpad.trim();
    const trimmedAge =
      tempAge.trim() === "" || tempAge === "Unknown"
        ? "Unknown"
        : tempAge.trim();
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

  const { isDark } = useThemeContext();

  const containerStyle = {
    backgroundColor: theme.modal,
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  const navContainerStyle = {
    backgroundColor: "var(--theme-part-detail-nav-bg)",
    borderRightColor: theme.border,
  };

  const sectionCardStyle = {
    backgroundColor: "var(--theme-part-detail-section-card-bg)",
    borderColor: theme.border,
  };

  const subCardStyle = {
    backgroundColor: "var(--theme-part-detail-sub-card-bg)",
    borderColor: theme.border,
  };

  const listItemStyle = {
    backgroundColor: "var(--theme-part-detail-list-item-bg)",
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  const modalContainerStyle = {
    backgroundColor: "var(--theme-part-detail-modal-container-bg)",
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  const modalFieldCardStyle = {
    backgroundColor: "var(--theme-part-detail-modal-field-card-bg)",
    borderColor: theme.border,
  };

  const modalInputStyle = {
    backgroundColor: "var(--theme-part-detail-modal-input-bg)",
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  const modalTextareaStyle = {
    backgroundColor: "var(--theme-part-detail-modal-textarea-bg)",
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  // When adding an impression, softly blur the background card

  const handleDeletePart = () => {
    if (!selectedPartId) return;
    const confirmed = window.confirm(
      "Delete this part and all related connections?"
    );
    if (!confirmed) return;
    removePartFromAllTensions(selectedPartId);
    deleteEdges(selectedPartId);
    deleteNode(selectedPartId);
    setSelectedPartId(undefined);
  };

  const handleBackdropClick = () => {
    setSelectedPartId(undefined);
  };

  // Calculate positioning based on screen width
  // When >= 1400px, center the pane accounting for the 313px impression display
  // The impression display is at left-4 (16px) and is 313px wide = 329px total
  // We shift the pane right by half of that to center it in the remaining space
  const impressionDisplayWidth = 313;
  const impressionDisplayOffset = 16; // left-4 = 16px
  const impressionDisplayTotal =
    impressionDisplayWidth + impressionDisplayOffset;
  const shouldShiftForImpressionDisplay = windowWidth >= 1400;
  const shiftAmount = shouldShiftForImpressionDisplay
    ? impressionDisplayTotal / 2
    : 0;

  return (
    <div
      className="fixed inset-0 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 theme-dark:shadow-[var(--theme-part-detail-container-shadow)]"
      style={{
        backgroundColor: "var(--theme-part-detail-backdrop-bg)",
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-5xl"
        style={{
          transform: shiftAmount > 0 ? `translateX(${shiftAmount}px)` : "none",
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
            className="theme-light:text-black theme-dark:text-white"
            strokeWidth={2}
            size={30}
          />
        </button>

        <div
          className="relative rounded-[28px] shadow-[0_24px_60px_rgba(15,23,42,0.28)] overflow-hidden w-full max-w-5xl max-h-[85vh] flex flex-col rounded-[10px] theme-dark:shadow-[var(--theme-part-detail-container-shadow)]"
          style={containerStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content with TOC */}
          <div className="flex flex-row flex-1 overflow-hidden min-h-0">
            {/* Table of Contents - Left Column */}
            {windowWidth >= 800 && (
              <div
                className="w-52 flex-shrink-0 flex flex-col border-r overflow-visible"
                style={navContainerStyle}
              >
                {/* Part Name Header */}
                <div
                  className="px-5 pt-5 pb-3 border-b bg-[var(--theme-card)]"
                  style={{
                    borderColor: theme.border,
                  }}
                >
                  <h2 className="text-sm font-semibold truncate text-[var(--theme-text-primary)]">
                    {tempName ||
                      (data.name as string) ||
                      (data.label as string) ||
                      "Untitled"}
                  </h2>
                </div>
                <nav className="flex-1 overflow-y-auto px-5 py-5 space-y-2 overflow-x-visible">
                  <button
                    onClick={() => scrollToSection(infoRef, "info")}
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium theme-light:text-slate-600 theme-dark:text-slate-400 theme-light:hover:text-black theme-dark:hover:text-[var(--theme-text-primary)] theme-dark:hover:bg-[color-mix(in_srgb,var(--theme-surface)_40%,transparent)] transition-none"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: "#8f85e7" }} />
                      <span>Info</span>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      scrollToSection(impressionsRef, "impressions")
                    }
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium theme-light:text-slate-600 theme-dark:text-slate-400 theme-light:hover:text-black theme-dark:hover:text-[var(--theme-text-primary)] theme-dark:hover:bg-[color-mix(in_srgb,var(--theme-surface)_40%,transparent)] transition-none"
                  >
                    <div className="flex items-center gap-2">
                      <Eye
                        className="w-4 h-4"
                        style={{ color: NodeBackgroundColors["emotion"] }}
                      />
                      <span>Impressions</span>
                    </div>
                  </button>
                  <button
                    onClick={() => scrollToSection(insightsRef, "insights")}
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium theme-light:text-slate-600 theme-dark:text-slate-400 theme-light:hover:text-black theme-dark:hover:text-[var(--theme-text-primary)] theme-dark:hover:bg-[color-mix(in_srgb,var(--theme-surface)_40%,transparent)] transition-none"
                    style={{
                      transition: "none",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Brain
                        className="w-4 h-4"
                        style={{ color: NodeBackgroundColors["thought"] }}
                      />
                      <span>Insights</span>
                    </div>
                  </button>
                  <button
                    onClick={() => scrollToSection(journalRef, "journal")}
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium theme-light:text-slate-600 theme-dark:text-slate-400 theme-light:hover:text-black theme-dark:hover:text-[var(--theme-text-primary)] theme-dark:hover:bg-[color-mix(in_srgb,var(--theme-surface)_40%,transparent)] transition-none"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span>Journal</span>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      scrollToSection(relationshipsRef, "relationships")
                    }
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium overflow-visible theme-light:text-slate-600 theme-dark:text-slate-400 theme-light:hover:text-black theme-dark:hover:text-[var(--theme-text-primary)] theme-dark:hover:bg-[color-mix(in_srgb,var(--theme-surface)_40%,transparent)] transition-none"
                  >
                    <div className="flex items-center gap-2 overflow-visible">
                      <Users className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>Relationships</span>
                    </div>
                  </button>
                </nav>
              </div>
            )}

            {/* Main Content - Right Column */}
            <div
              className={`${windowWidth < 800 ? "w-full" : "flex-1"} pl-8`}
              style={{
                overflow: "hidden",
                maxHeight: "85vh",
                paddingRight: "15px",
                paddingTop: "20px",
                paddingBottom: "20px",
              }}
            >
              <div
                ref={scrollableContentRef}
                className={`overflow-y-scroll space-y-12 bg-transparent`}
                style={{
                  height: "100%",
                  paddingRight: "15px",
                  paddingTop: "12px",
                  paddingBottom: "22px",
                }}
              >
                {/* Info Section */}
                <div ref={infoRef} className="relative space-y-4 mb-12">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold flex items-center gap-2 theme-light:text-slate-500 theme-dark:text-slate-400">
                          <User
                            className="w-[17px] h-[17px]"
                            style={{ color: "#8f85e7" }}
                          />
                          Info
                        </h3>
                        {!isEditingInfo && (
                          <button
                            onClick={() => {
                              setIsEditingInfo((prev) => !prev);
                            }}
                            className="p-2 rounded-full theme-light:text-slate-500 theme-light:hover:text-slate-700 theme-dark:text-slate-300 theme-dark:hover:text-slate-200"
                            style={{ transition: "none" }}
                            aria-label="Edit info"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditingInfo && (
                        <button
                          type="button"
                          onClick={saveAllInfo}
                          className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold shadow-sm hover:shadow-md theme-light:bg-[var(--theme-jazz-gradient)] theme-dark:bg-[#396bbc] theme-light:text-black theme-dark:text-white transition-none"
                          style={{
                            boxShadow: "0 6px 16px rgba(57, 107, 188, 0.28)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.classList.add(
                              "theme-light:bg-[linear-gradient(to_right,rgb(224,242,254),rgb(221,214,254),rgb(254,226,226))]"
                            );
                            if (
                              e.currentTarget.classList.contains("theme-dark")
                            ) {
                              e.currentTarget.style.backgroundColor = "#2f5aa3";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.classList.remove(
                              "theme-light:bg-[linear-gradient(to_right,rgb(224,242,254),rgb(221,214,254),rgb(254,226,226))]"
                            );
                            if (
                              e.currentTarget.classList.contains("theme-dark")
                            ) {
                              e.currentTarget.style.backgroundColor = "#396bbc";
                            }
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Save changes
                        </button>
                      )}
                      {isEditingInfo && (
                        <button
                          type="button"
                          onClick={() => setIsEditingInfo(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold theme-light:text-slate-700 theme-light:hover:bg-slate-100 theme-dark:text-slate-200 theme-dark:hover:bg-slate-700/60 theme-dark:bg-[rgba(51,65,85,0.4)] transition-none"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        disabled
                        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border cursor-not-allowed opacity-50 theme-light:border-slate-300/50 theme-light:bg-slate-100/50 theme-dark:border-slate-600/40 theme-dark:bg-slate-950/30 text-slate-400"
                      >
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <span>Deepen</span>
                      </button>
                      <button
                        onClick={handleDeletePart}
                        className="flex items-center justify-center px-3 py-2 rounded-full text-sm font-medium border border-transparent hover:bg-rose-500/20 theme-light:text-rose-400 theme-light:hover:text-rose-500 theme-dark:text-rose-300 theme-dark:hover:text-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Info Grid */}
                  <div
                    className={`p-6 space-y-6 rounded-3xl shadow-sm ${isEditingInfo ? "border-[3px] border-[rgba(57,107,188,0.3)]" : ""}`}
                    style={subCardStyle}
                  >
                    {/* First Row: Image and Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Image - Left Column */}
                      <div className="lg:col-span-1">
                        <div
                          className="w-full aspect-square relative shadow-sm overflow-hidden group rounded-2xl border"
                          style={subCardStyle}
                        >
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
                              className="w-full h-full theme-light:bg-gray-100 theme-light:hover:bg-gray-200 theme-dark:bg-gray-600 theme-dark:hover:bg-gray-500 flex flex-col items-center justify-center cursor-pointer"
                            >
                              <SquareUserRound
                                size={64}
                                className="theme-light:text-gray-400 theme-dark:text-gray-300"
                              />
                              <span className="text-xs mt-2 theme-light:text-gray-500 theme-dark:text-gray-300">
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
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wide theme-light:text-slate-500 theme-dark:text-slate-400">
                                Name
                              </label>
                              {isEditingInfo ? (
                                <input
                                  type="text"
                                  value={tempName}
                                  onChange={(e) => setTempName(e.target.value)}
                                  onBlur={() => {
                                    const currentName =
                                      (data.name as string) ||
                                      (data.label as string) ||
                                      "";
                                    const trimmed = tempName.trim();
                                    if (trimmed !== currentName) {
                                      updatePartName(selectedPartId, trimmed);
                                      setTempName(trimmed);
                                    }
                                  }}
                                  className={`w-full shadow-inner font-semibold tracking-tight focus:outline-none ${
                                    isDark
                                      ? "text-slate-50 placeholder:text-slate-500"
                                      : "bg-white focus:bg-white text-slate-900 placeholder:text-slate-400"
                                  }`}
                                  style={{
                                    fontSize: "16px",
                                    height: "52px",
                                    padding: "10px",
                                    borderRadius: "12px",
                                    ...(isDark
                                      ? {
                                          backgroundColor: "rgb(33 37 41)",
                                          WebkitBoxShadow:
                                            "0 0 0 1000px rgb(33 37 41) inset",
                                          boxShadow: "none",
                                        }
                                      : {}),
                                  }}
                                  placeholder="Name this part"
                                  autoFocus
                                />
                              ) : (
                                <h2 className="text-3xl font-semibold tracking-tight theme-light:text-slate-900 theme-dark:text-slate-50">
                                  {tempName || "Untitled"}
                                </h2>
                              )}
                            </div>

                            <div className="space-y-3">
                              <label className="text-xs font-medium uppercase tracking-wide theme-light:text-slate-500 theme-dark:text-slate-400">
                                Part Type
                              </label>
                              {isEditingInfo ? (
                                <div className="flex flex-wrap gap-2 pl-0.5">
                                  {["manager", "firefighter", "exile"].map(
                                    (type) => {
                                      const currentType =
                                        tempPartType ||
                                        (data.customPartType as string) ||
                                        (data.partType as string) ||
                                        "";
                                      const isSelected = currentType === type;

                                      const pillBase =
                                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize cursor-pointer";
                                      const typeStyles: Record<
                                        string,
                                        {
                                          selected: string;
                                          idle: string;
                                          hover: string;
                                        }
                                      > = {
                                        manager: {
                                          selected:
                                            "theme-light:bg-sky-100 theme-light:text-sky-600 theme-dark:bg-sky-500/15 theme-dark:text-sky-100",
                                          idle: "theme-light:bg-slate-100/60 theme-dark:text-slate-400 text-slate-400",
                                          hover:
                                            "theme-light:bg-sky-100 theme-light:text-sky-600 theme-dark:bg-sky-500/15 theme-dark:text-sky-100",
                                        },
                                        firefighter: {
                                          selected:
                                            "theme-light:bg-rose-100 theme-light:text-rose-600 theme-dark:bg-rose-500/15 theme-dark:text-rose-100",
                                          idle: "theme-light:bg-slate-100/60 theme-dark:text-slate-400 text-slate-400",
                                          hover:
                                            "theme-light:bg-rose-100 theme-light:text-rose-600 theme-dark:bg-rose-500/15 theme-dark:text-rose-100",
                                        },
                                        exile: {
                                          selected:
                                            "theme-light:bg-purple-100 theme-light:text-purple-600 theme-dark:bg-purple-500/15 theme-dark:text-purple-100",
                                          idle: "theme-light:bg-slate-100/60 theme-dark:text-slate-400 text-slate-400",
                                          hover:
                                            "theme-light:bg-purple-100 theme-light:text-purple-600 theme-dark:bg-purple-500/15 theme-dark:text-purple-100",
                                        },
                                      };

                                      const typeIcons: Record<
                                        string,
                                        React.ReactNode
                                      > = {
                                        manager: (
                                          <Brain className="w-3.5 h-3.5" />
                                        ),
                                        firefighter: (
                                          <Shield className="w-3.5 h-3.5" />
                                        ),
                                        exile: (
                                          <Heart className="w-3.5 h-3.5" />
                                        ),
                                      };

                                      const styles =
                                        typeStyles[type] || typeStyles.manager;
                                      const isHovered =
                                        hoveredPartType === type;

                                      // Determine which style to use: selected pills stay selected, hovered (non-selected) pills show hover
                                      const getPillStyle = () => {
                                        if (isSelected) return styles.selected;
                                        if (isHovered) return styles.hover;
                                        return styles.idle;
                                      };

                                      return (
                                        <button
                                          key={type}
                                          onClick={() => {
                                            setTempPartType(type);
                                            updateNode(selectedPartId, {
                                              data: {
                                                ...partNode.data,
                                                customPartType: type,
                                                partType: type,
                                              },
                                            });
                                          }}
                                          className={`${pillBase} ${getPillStyle()} ${!isSelected && !isHovered ? "theme-dark:bg-[rgb(33_37_41)]" : ""}`}
                                          onMouseEnter={() =>
                                            setHoveredPartType(type)
                                          }
                                          onMouseLeave={() =>
                                            setHoveredPartType(null)
                                          }
                                        >
                                          {typeIcons[type]}
                                          {type}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2 pl-0.5">
                                  {(() => {
                                    const currentType =
                                      tempPartType ||
                                      (data.customPartType as string) ||
                                      (data.partType as string) ||
                                      "";
                                    if (!currentType) {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize theme-light:text-slate-500 theme-dark:text-slate-300">
                                          <User className="w-3.5 h-3.5" />
                                          No type set
                                        </span>
                                      );
                                    }

                                    const pillBase =
                                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize";
                                    const partTypeMapping: Record<
                                      string,
                                      {
                                        icon: React.ReactNode;
                                        className: string;
                                      }
                                    > = {
                                      manager: {
                                        icon: <Brain className="w-3.5 h-3.5" />,
                                        className:
                                          "theme-light:bg-sky-100 theme-light:text-sky-600 theme-dark:bg-sky-500/15 theme-dark:text-sky-100",
                                      },
                                      firefighter: {
                                        icon: (
                                          <Shield className="w-3.5 h-3.5" />
                                        ),
                                        className:
                                          "theme-light:bg-rose-100 theme-light:text-rose-600 theme-dark:bg-rose-500/15 theme-dark:text-rose-100",
                                      },
                                      exile: {
                                        icon: <Heart className="w-3.5 h-3.5" />,
                                        className:
                                          "theme-light:bg-purple-100 theme-light:text-purple-600 theme-dark:bg-purple-500/15 theme-dark:text-purple-100",
                                      },
                                    };

                                    const pill = partTypeMapping[
                                      currentType
                                    ] || {
                                      icon: <User className="w-3.5 h-3.5" />,
                                      className:
                                        "theme-light:bg-slate-100 theme-light:text-slate-600 theme-dark:text-slate-200",
                                    };

                                    return (
                                      <span
                                        className={`${pillBase} ${pill.className} theme-dark:bg-[rgb(33_37_41)]`}
                                      >
                                        {pill.icon}
                                        {currentType}
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label
                              className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Age
                            </label>
                            {isEditingInfo ? (
                              <input
                                type="number"
                                value={
                                  tempAge === "" || tempAge === "Unknown"
                                    ? ""
                                    : tempAge
                                }
                                onChange={(e) =>
                                  setTempAge(e.target.value || "Unknown")
                                }
                                onBlur={() => {
                                  if (
                                    tempAge !==
                                    ((data.age as string) || "Unknown")
                                  ) {
                                    updateNode(selectedPartId, {
                                      data: {
                                        ...partNode.data,
                                        age:
                                          tempAge === "Unknown" ? "" : tempAge,
                                      },
                                    });
                                  }
                                }}
                                className={`block w-auto max-w-[100px] shadow-inner focus:outline-none font-medium ${
                                  isDark
                                    ? "text-slate-100 placeholder:text-slate-500"
                                    : "bg-white focus:bg-white text-slate-900 placeholder:text-slate-400"
                                }`}
                                style={{
                                  fontSize: "13px",
                                  height: "40px",
                                  padding: "10px",
                                  fontWeight: "500",
                                  borderRadius: "12px",
                                  ...(isDark
                                    ? {
                                        backgroundColor: "rgb(33 37 41)",
                                        WebkitBoxShadow:
                                          "0 0 0 1000px rgb(33 37 41) inset",
                                        boxShadow: "none",
                                      }
                                    : {}),
                                }}
                                placeholder="Unknown"
                                min="0"
                              />
                            ) : (
                              <div
                                className={`text-base ${tempAge && tempAge !== "Unknown" ? (isDark ? "text-slate-100" : "text-slate-900") : isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                {tempAge && tempAge !== "Unknown"
                                  ? tempAge
                                  : "—"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label
                              className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Gender
                            </label>
                            {isEditingInfo ? (
                              <input
                                type="text"
                                value={tempGender}
                                onChange={(e) => setTempGender(e.target.value)}
                                onBlur={() => {
                                  if (
                                    tempGender !==
                                    ((data.gender as string) || "")
                                  ) {
                                    updateNode(selectedPartId, {
                                      data: {
                                        ...partNode.data,
                                        gender: tempGender,
                                      },
                                    });
                                  }
                                }}
                                className={`block w-full max-w-[200px] shadow-inner focus:outline-none font-medium ${
                                  isDark
                                    ? "text-slate-100 placeholder:text-slate-500"
                                    : "bg-white focus:bg-white text-slate-900 placeholder:text-slate-400"
                                }`}
                                style={{
                                  fontSize: "13px",
                                  height: "40px",
                                  padding: "10px",
                                  fontWeight: "500",
                                  borderRadius: "12px",
                                  ...(isDark
                                    ? {
                                        backgroundColor: "rgb(33 37 41)",
                                        WebkitBoxShadow:
                                          "0 0 0 1000px rgb(33 37 41) inset",
                                        boxShadow: "none",
                                      }
                                    : {}),
                                }}
                                placeholder="Gender"
                              />
                            ) : (
                              <div
                                className={`text-base ${tempGender ? (isDark ? "text-slate-100" : "text-slate-900") : isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                {tempGender || "—"}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <label
                            className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            Description
                          </label>
                          {isEditingInfo ? (
                            <textarea
                              value={tempScratchpad}
                              onChange={(e) =>
                                setTempScratchpad(e.target.value)
                              }
                              onBlur={() => {
                                if (
                                  tempScratchpad !==
                                  ((data.scratchpad as string) || "")
                                ) {
                                  updateNode(selectedPartId, {
                                    data: {
                                      ...partNode.data,
                                      scratchpad: tempScratchpad,
                                    },
                                  });
                                }
                              }}
                              className={`w-full px-3.5 py-3 min-h-[140px] resize-none leading-relaxed shadow-inner focus:outline-none font-medium ${
                                isDark
                                  ? "text-slate-100 placeholder:text-slate-500"
                                  : "bg-white focus:bg-white text-slate-800 placeholder:text-slate-400"
                              }`}
                              style={{
                                ...(isDark
                                  ? {
                                      backgroundColor: "rgb(33 37 41)",
                                      WebkitBoxShadow:
                                        "0 0 0 1000px rgb(33 37 41) inset",
                                      boxShadow: "none",
                                    }
                                  : {}),
                                fontSize: "13px",
                                fontWeight: "500",
                                borderRadius: "12px",
                              }}
                              placeholder="Add a description..."
                            />
                          ) : (
                            <p
                              className={`text-base leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-200" : "text-slate-800"}`}
                            >
                              {tempScratchpad || (
                                <span
                                  className={
                                    isDark ? "text-slate-500" : "text-slate-400"
                                  }
                                >
                                  No description added yet.
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impressions Section */}
                <div ref={impressionsRef} className="relative space-y-4 mb-12">
                  <h3
                    className={`text-[16px] font-semibold flex items-center gap-2 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <Eye
                      className="w-[17px] h-[17px]"
                      style={{ color: NodeBackgroundColors["emotion"] }}
                    />
                    Impressions
                  </h3>

                  {/* Flexible Layout for Impressions */}
                  <div
                    className="space-y-4"
                    onDrop={handleDropImpression}
                    onDragOver={handleDragOver}
                  >
                    {/* All Impressions: emotion, thought, sensation, behavior, other */}
                    <div className="columns-1 lg:columns-2 gap-4 space-y-4">
                      {ImpressionList.map((impression) => {
                        const impressions =
                          (data[
                            ImpressionTextType[impression]
                          ] as ImpressionNode[]) || [];

                        return (
                          <div
                            key={impression}
                            className="break-inside-avoid rounded-2xl p-4 shadow-sm mb-4"
                            style={{
                              ...subCardStyle,
                              ...(isDark
                                ? { backgroundColor: "rgba(42, 46, 50, 0.75)" }
                                : {}),
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h4
                                  className="font-semibold capitalize text-sm"
                                  style={{
                                    color: `var(--theme-impression-${impression}-part-details-header)`,
                                  }}
                                >
                                  {impression}
                                </h4>
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `var(--theme-impression-${impression}-bg)`,
                                    color: `var(--theme-impression-${impression}-text)`,
                                  }}
                                >
                                  {impressions.length}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  if (selectedPartId) {
                                    setImpressionModalTarget(
                                      selectedPartId,
                                      impression
                                    );
                                    setShowImpressionModal(true);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                                  isDark
                                    ? "text-slate-200"
                                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                                }`}
                                style={{
                                  border: "none",
                                  ...(isDark
                                    ? {}
                                    : { borderTop: "1px solid #00000012" }),
                                  ...(isDark
                                    ? {
                                        backgroundColor: "rgb(42, 46, 50)",
                                        boxShadow:
                                          "rgb(0 0 0 / 20%) 0px 2px 4px",
                                      }
                                    : {}),
                                }}
                                onMouseEnter={(e) => {
                                  if (isDark) {
                                    e.currentTarget.style.backgroundColor =
                                      theme.buttonHover;
                                  } else {
                                    e.currentTarget.style.backgroundColor =
                                      "#f1f5f9";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark
                                    ? "rgb(42, 46, 50)"
                                    : "white";
                                }}
                              >
                                Add
                              </button>
                            </div>

                            <div className="space-y-2 mb-2">
                              {impressions.length > 0 ? (
                                impressions.map((imp, index) => {
                                  return (
                                    <div
                                      key={index}
                                      className="group flex items-center justify-between rounded-xl px-3 py-2 shadow-sm"
                                      style={{
                                        ...listItemStyle,
                                        backgroundColor: `var(--theme-impression-${impression}-bg)`,
                                        border: "none",
                                        color: `var(--theme-impression-${impression}-text)`,
                                      }}
                                    >
                                      <span className="font-medium text-xs">
                                        {imp.data?.label || imp.id}
                                      </span>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                        <button
                                          onClick={() =>
                                            handleReturnToSidebar(
                                              impression,
                                              imp.id
                                            )
                                          }
                                          className="p-1"
                                          style={{
                                            color: `var(--theme-impression-${impression}-text)`,
                                          }}
                                          title="Return to sidebar"
                                        >
                                          <ListRestart size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRemoveImpression(
                                              impression,
                                              imp.id
                                            )
                                          }
                                          className="p-1"
                                          style={{
                                            color: `var(--theme-impression-${impression}-text)`,
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
                                  className="rounded-xl border px-3 py-2"
                                  style={{
                                    borderColor: theme.border,
                                    backgroundColor: isDark
                                      ? theme.surface
                                      : theme.card,
                                  }}
                                >
                                  <span
                                    className="text-xs"
                                    style={{ color: theme.textMuted }}
                                  >
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

                {/* Insights Section */}
                <div ref={insightsRef} className="relative space-y-4">
                  <h4
                    className={`text-[16px] font-semibold flex items-center gap-2 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <Brain
                      className="w-[17px] h-[17px]"
                      style={{ color: NodeBackgroundColors["thought"] }}
                    />
                    Insights
                  </h4>
                  <div className="mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Needs */}
                      <div
                        className="p-4 shadow-sm rounded-2xl"
                        style={{
                          ...subCardStyle,
                          ...(isDark
                            ? { backgroundColor: "rgba(42, 46, 50, 0.75)" }
                            : {}),
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4
                            className={`font-semibold capitalize text-sm flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                          >
                            <Heart
                              className="w-4 h-4"
                              style={{ color: "#7b42e2" }}
                            />
                            Needs
                          </h4>
                          <button
                            onClick={() => {
                              setAddingNeedsOrFears("needs");
                              setNeedsFearsInput("");
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                              isDark
                                ? "text-slate-200"
                                : "text-slate-600 bg-white hover:bg-slate-50"
                            }`}
                            style={{
                              border: "none",
                              ...(isDark
                                ? { borderTop: "1px solid rgba(0, 0, 0, 0.15)" }
                                : { borderTop: "1px solid #00000012" }),
                              ...(isDark
                                ? {
                                    backgroundColor: "rgb(42, 46, 50)",
                                    boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px",
                                  }
                                : {}),
                              transition: "none !important",
                            }}
                            onMouseEnter={(e) => {
                              if (isDark) {
                                e.currentTarget.style.backgroundColor =
                                  theme.buttonHover;
                              } else {
                                e.currentTarget.style.backgroundColor =
                                  "#f1f5f9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isDark
                                ? "rgb(42, 46, 50)"
                                : "white";
                            }}
                          >
                            Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {((data.needs as string[]) || []).map(
                            (need: string, index: number) => (
                              <div
                                key={index}
                                className="group flex items-center justify-between rounded-lg px-3 py-2 shadow-sm"
                                style={{
                                  ...listItemStyle,
                                  backgroundColor: isDark
                                    ? "rgba(42, 46, 50, 0.75)"
                                    : "white",
                                  border: "none",
                                  color: "#7b42e2",
                                }}
                              >
                                <span
                                  className="text-xs font-medium leading-relaxed"
                                  style={{ color: "#7b42e2" }}
                                >
                                  {need}
                                </span>
                                <button
                                  onClick={() => removeListItem("needs", index)}
                                  className="opacity-0 group-hover:opacity-100 p-1"
                                  aria-label="Remove need"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )
                          )}
                          {((data.needs as string[]) || []).length === 0 && (
                            <div
                              className={`text-center py-4 text-xs italic ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              No needs added yet
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fears */}
                      <div
                        className="rounded-2xl p-4 shadow-sm"
                        style={{
                          ...subCardStyle,
                          ...(isDark
                            ? { backgroundColor: "rgba(42, 46, 50, 0.75)" }
                            : {}),
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4
                            className={`font-semibold capitalize text-sm flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                          >
                            <Shield
                              className="w-4 h-4"
                              style={{ color: "#f78585" }}
                            />
                            Fears
                          </h4>
                          <button
                            onClick={() => {
                              setAddingNeedsOrFears("fears");
                              setNeedsFearsInput("");
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                              isDark
                                ? "text-slate-200"
                                : "text-slate-600 bg-white hover:bg-slate-50"
                            }`}
                            style={{
                              border: "none",
                              ...(isDark
                                ? { borderTop: "1px solid rgba(0, 0, 0, 0.15)" }
                                : { borderTop: "1px solid #00000012" }),
                              ...(isDark
                                ? {
                                    backgroundColor: "rgb(42, 46, 50)",
                                    boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px",
                                  }
                                : {}),
                              transition: "none !important",
                            }}
                            onMouseEnter={(e) => {
                              if (isDark) {
                                e.currentTarget.style.backgroundColor =
                                  theme.buttonHover;
                              } else {
                                e.currentTarget.style.backgroundColor =
                                  "#f1f5f9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isDark
                                ? "rgb(42, 46, 50)"
                                : "white";
                            }}
                          >
                            Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {((data.fears as string[]) || []).map(
                            (fear: string, index: number) => (
                              <div
                                key={index}
                                className="group flex items-center justify-between rounded-lg px-3 py-2 shadow-sm"
                                style={{
                                  ...listItemStyle,
                                  backgroundColor: isDark
                                    ? "rgba(42, 46, 50, 0.75)"
                                    : "white",
                                  border: "none",
                                  color: "#f78585",
                                }}
                              >
                                <span
                                  className="text-xs font-medium leading-relaxed"
                                  style={{ color: "#f78585" }}
                                >
                                  {fear}
                                </span>
                                <button
                                  onClick={() => removeListItem("fears", index)}
                                  className="opacity-0 group-hover:opacity-100 p-1"
                                  aria-label="Remove fear"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )
                          )}
                          {((data.fears as string[]) || []).length === 0 && (
                            <div
                              className={`text-center py-4 text-xs italic ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              No fears added yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Journal History Section */}
                  <div ref={journalRef} className="relative space-y-4 mb-12">
                    <h3
                      className={`text-[16px] font-semibold flex items-center gap-2 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <BookOpen className="w-[17px] h-[17px] text-amber-600" />
                      Journal
                    </h3>

                    <div
                      className="shadow-sm rounded-2xl"
                      style={{
                        ...subCardStyle,
                        ...(isDark
                          ? { backgroundColor: "rgba(42, 46, 50, 0.75)" }
                          : {}),
                        padding: "20px",
                      }}
                    >
                      {isLoadingJournal ? (
                        <div
                          className="rounded-2xl border flex flex-col items-center justify-center gap-3 py-8"
                          style={subCardStyle}
                        >
                          <LoadingSpinner
                            variant="sparkles"
                            size="md"
                            message="Loading journal entries..."
                          />
                        </div>
                      ) : journalEntries.length === 0 ? (
                        <div
                          className="rounded-2xl py-8 px-4"
                          style={subCardStyle}
                        >
                          <div className="text-center mb-4">
                            <BookOpen
                              className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            />
                            <h3
                              className={`text-lg font-semibold mb-2 ${isDark ? "text-slate-100" : "text-slate-700"}`}
                            >
                              No journal entries yet
                            </h3>
                            <p
                              className={
                                isDark ? "text-slate-400" : "text-slate-500"
                              }
                            >
                              Start writing about this part to see entries here.
                            </p>
                          </div>
                          <div className="flex justify-center">
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
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium flex-shrink-0 shadow-sm"
                              style={{
                                border: "none",
                                ...(isDark
                                  ? {
                                      borderTop:
                                        "1px solid rgba(0, 0, 0, 0.15)",
                                    }
                                  : { borderTop: "1px solid #00000012" }),
                                color: isDark ? theme.textPrimary : "#475569",
                                backgroundColor: isDark
                                  ? "rgb(59, 63, 67)"
                                  : "#ffffff",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDark
                                  ? theme.buttonHover
                                  : "#f1f5f9";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isDark
                                  ? "rgb(59, 63, 67)"
                                  : "#ffffff";
                              }}
                              title="Start a new journal entry"
                            >
                              <Plus size={14} />
                              New Entry
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                            >
                              {journalEntries.length}{" "}
                              {journalEntries.length === 1
                                ? "entry"
                                : "entries"}
                            </span>
                            <div className="flex items-center gap-3">
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
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium flex-shrink-0 shadow-sm"
                                style={{
                                  border: "none",
                                  ...(isDark
                                    ? {
                                        borderTop:
                                          "1px solid rgba(0, 0, 0, 0.15)",
                                      }
                                    : { borderTop: "1px solid #00000012" }),
                                  color: isDark ? theme.textPrimary : "#475569",
                                  backgroundColor: isDark
                                    ? "rgb(59, 63, 67)"
                                    : "#ffffff",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark
                                    ? theme.buttonHover
                                    : "#f1f5f9";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark
                                    ? "rgb(59, 63, 67)"
                                    : "#ffffff";
                                }}
                                title="Start a new journal entry"
                              >
                                <Plus size={14} />
                                New Entry
                              </button>
                              <button
                                onClick={() => setShowJournalHistoryModal(true)}
                                className="border-none inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm border-top-[var(--theme-button-border-top)]"
                                style={{
                                  color: isDark ? theme.textPrimary : "#475569",
                                  backgroundColor: isDark
                                    ? "rgb(59, 63, 67)"
                                    : "#ffffff",
                                  transition: "none !important",
                                  WebkitTransition: "none !important",
                                  MozTransition: "none !important",
                                  OTransition: "none !important",
                                  msTransition: "none !important",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark
                                    ? theme.buttonHover
                                    : "#f1f5f9";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark
                                    ? "rgb(59, 63, 67)"
                                    : "#ffffff";
                                }}
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>View All</span>
                              </button>
                            </div>
                          </div>
                          {/* Show only the 2 most recent entries */}
                          <div className="space-y-3">
                            {journalEntries.slice(0, 2).map((entry) => {
                              // Determine if it's a text thread
                              const isTextThread = (() => {
                                try {
                                  const parsed = JSON.parse(entry.content);
                                  return Array.isArray(parsed);
                                } catch {
                                  return false;
                                }
                              })();

                              // Check if entry was updated (different from created)
                              const wasUpdated =
                                entry.updatedAt &&
                                entry.createdAt &&
                                new Date(entry.updatedAt).getTime() !==
                                  new Date(entry.createdAt).getTime();

                              // Get content preview
                              const contentPreview = (() => {
                                if (isTextThread) {
                                  try {
                                    const parsed = JSON.parse(entry.content);
                                    if (
                                      Array.isArray(parsed) &&
                                      parsed.length > 0
                                    ) {
                                      // Get part nodes for speaker name resolution
                                      const partNodesMap = new Map(
                                        nodes
                                          .filter((n) => n.type === "part")
                                          .map((n) => [n.id, n])
                                      );

                                      return (
                                        parsed
                                          .slice(0, 8)
                                          .map((msg: any) => {
                                            let speakerLabel = "Unknown";
                                            if (msg.speakerId === "self") {
                                              speakerLabel = "Self";
                                            } else if (
                                              msg.speakerId === "unknown" ||
                                              msg.speakerId === "?"
                                            ) {
                                              speakerLabel = "Unknown";
                                            } else {
                                              const partNode = partNodesMap.get(
                                                msg.speakerId
                                              );
                                              speakerLabel =
                                                partNode?.data?.label ||
                                                partNode?.data?.name ||
                                                msg.speakerId;
                                            }
                                            return `${speakerLabel}: ${msg.text || ""}`;
                                          })
                                          .join("\n") +
                                        (parsed.length > 8
                                          ? `\n... (${parsed.length - 8} more messages)`
                                          : "")
                                      );
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
                                  text = (
                                    temp.textContent ||
                                    temp.innerText ||
                                    ""
                                  ).trim();
                                } else {
                                  // Server-side fallback
                                  text = text
                                    .replace(/<[^>]+>/g, " ")
                                    .replace(/\s+/g, " ")
                                    .trim();
                                }
                                return text.length > 500
                                  ? text.substring(0, 500) + "..."
                                  : text;
                              })();

                              // Get word/character count
                              const wordCount = isTextThread
                                ? (() => {
                                    try {
                                      const parsed = JSON.parse(entry.content);
                                      if (Array.isArray(parsed)) {
                                        return parsed.reduce(
                                          (acc: number, msg: any) => {
                                            return (
                                              acc +
                                              (msg.text || "")
                                                .split(/\s+/)
                                                .filter(
                                                  (w: string) => w.length > 0
                                                ).length
                                            );
                                          },
                                          0
                                        );
                                      }
                                    } catch {}
                                    return 0;
                                  })()
                                : (entry.content || "")
                                    .split(/\s+/)
                                    .filter((w: string) => w.length > 0).length;
                              const charCount = entry.content?.length || 0;

                              return (
                                <div
                                  key={entry.id}
                                  className="rounded-2xl p-5 shadow-sm shadow-inner hover:shadow-md transition-shadow"
                                  style={{
                                    ...subCardStyle,
                                    backgroundColor: isDark
                                      ? "rgb(33, 37, 41)"
                                      : "white",
                                  }}
                                >
                                  {/* Header with dates and actions */}
                                  <div className="flex items-start justify-between mb-3 gap-4">
                                    <div className="flex-1 space-y-1.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Clock
                                          className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                        />
                                        <span
                                          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                        >
                                          Created:{" "}
                                          {new Date(
                                            entry.createdAt
                                          ).toLocaleDateString()}{" "}
                                          at{" "}
                                          {new Date(
                                            entry.createdAt
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                        {wasUpdated && (
                                          <>
                                            <span
                                              className={
                                                isDark
                                                  ? "text-slate-600"
                                                  : "text-slate-400"
                                              }
                                            >
                                              •
                                            </span>
                                            <span
                                              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                            >
                                              Updated:{" "}
                                              {new Date(
                                                entry.updatedAt
                                              ).toLocaleDateString()}{" "}
                                              at{" "}
                                              {new Date(
                                                entry.updatedAt
                                              ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      {/* Entry type and metadata */}
                                      <div className="flex items-center gap-3 flex-wrap">
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                                            isTextThread
                                              ? isDark
                                                ? "bg-purple-900/40 text-purple-200"
                                                : "bg-purple-50 text-purple-700"
                                              : isDark
                                                ? "bg-blue-900/40 text-blue-200"
                                                : "bg-blue-50 text-blue-700"
                                          }`}
                                        >
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
                                        <span
                                          className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                        >
                                          {wordCount} words •{" "}
                                          {charCount.toLocaleString()} chars
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button
                                        onClick={() => {
                                          // Open this entry in the main journal drawer
                                          if (selectedPartId && partNode) {
                                            // Detect mode from content
                                            const detectMode = (
                                              content: string
                                            ): "normal" | "textThread" => {
                                              if (!content) return "normal";
                                              try {
                                                const parsed =
                                                  JSON.parse(content);
                                                if (Array.isArray(parsed)) {
                                                  return "textThread";
                                                }
                                              } catch {
                                                // Not JSON, assume normal journal
                                              }
                                              return "normal";
                                            };

                                            const mode = detectMode(
                                              entry.content
                                            );

                                            setJournalTarget({
                                              type: "node",
                                              nodeId: selectedPartId,
                                              nodeType: "part",
                                              title:
                                                partNode.data?.label || "Part",
                                            });

                                            // Set mode and load entry - we need to trigger this after the drawer opens
                                            setTimeout(() => {
                                              if (typeof window === "undefined")
                                                return;

                                              const store =
                                                useJournalStore.getState();
                                              store.loadEntry({
                                                entryId: entry.id,
                                                content: entry.content,
                                                speakers: Array.isArray(
                                                  entry.speakers
                                                )
                                                  ? entry.speakers
                                                  : [],
                                              });

                                              // Dispatch a custom event to set the mode
                                              try {
                                                const event = createCustomEvent(
                                                  "journal-set-mode",
                                                  { mode }
                                                );
                                                if (
                                                  event &&
                                                  typeof window !== "undefined"
                                                ) {
                                                  window.dispatchEvent(event);
                                                }
                                              } catch (error) {
                                                console.error(
                                                  "Failed to dispatch journal-set-mode event:",
                                                  error
                                                );
                                              }
                                            }, 100);
                                          }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm"
                                        style={{
                                          backgroundColor: isDark
                                            ? "rgb(42, 46, 50)"
                                            : "white",
                                          border: "none",
                                          ...(isDark
                                            ? {
                                                borderTop:
                                                  "1px solid rgba(0, 0, 0, 0.15)",
                                              }
                                            : {
                                                borderTop:
                                                  "1px solid #00000012",
                                              }),
                                          color: isDark
                                            ? theme.textPrimary
                                            : "#475569",
                                          transition: "none !important",
                                          WebkitTransition: "none !important",
                                          MozTransition: "none !important",
                                          OTransition: "none !important",
                                          msTransition: "none !important",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor =
                                            isDark
                                              ? theme.buttonHover
                                              : "#f1f5f9";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor =
                                            isDark
                                              ? "rgb(42, 46, 50)"
                                              : "white";
                                        }}
                                        title="Open in journal"
                                      >
                                        <BookOpen className="w-3 h-3" />
                                        <span>Open</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          extractImpressionsFromEntry(entry.id)
                                        }
                                        disabled={true}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed opacity-50"
                                        style={{
                                          backgroundColor: isDark
                                            ? theme.surface
                                            : "#e2e8f0",
                                          color: isDark
                                            ? theme.textMuted
                                            : "#94a3b8",
                                        }}
                                        title="Coming soon"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                        <span>Extract</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          deleteJournalEntry(entry.id)
                                        }
                                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                                          isDark
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
                                  <div
                                    className={`whitespace-pre-wrap text-sm leading-relaxed max-h-64 overflow-y-auto ${
                                      isDark
                                        ? "text-slate-300"
                                        : "text-slate-700"
                                    }`}
                                    style={{
                                      border: "none",
                                      padding: "10px",
                                      borderRadius: "10px",
                                      ...(isDark
                                        ? { background: "#272b2f" }
                                        : { background: "#f8fafc" }),
                                    }}
                                  >
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
                  <div
                    ref={relationshipsRef}
                    className="relative space-y-4 mb-12"
                  >
                    <h3
                      className={`text-[16px] font-semibold flex items-center gap-2 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <Users className="w-[17px] h-[17px] text-rose-600" />
                      Relationships
                    </h3>

                    {relationships.length > 0 ? (
                      <div className="space-y-4">
                        {relationships.map((rel) => {
                          const isTension = rel.relationshipType === "tension";
                          const isInteraction =
                            rel.relationshipType === "interaction";
                          const connectedNodes =
                            (rel as any).connectedNodes || [];

                          return (
                            <div
                              key={rel.id}
                              className="rounded-2xl p-4 shadow-sm"
                              style={{
                                border: "none",
                                backgroundColor: isTension
                                  ? isDark
                                    ? "rgba(42, 46, 50, 0.75)"
                                    : "rgba(247,242,255,0.7)"
                                  : isInteraction
                                    ? isDark
                                      ? "rgba(42, 46, 50, 0.75)"
                                      : "rgba(224,242,254,0.7)"
                                    : isDark
                                      ? "rgba(42, 46, 50, 0.75)"
                                      : "#ffffff",
                                background:
                                  isTension && isDark
                                    ? "linear-gradient(140deg, rgb(42, 31, 61), rgb(39, 33, 47))"
                                    : isInteraction && isDark
                                      ? "linear-gradient(140deg, rgb(31, 42, 61), rgb(33, 39, 47))"
                                      : isTension && !isDark
                                        ? "linear-gradient(140deg, rgba(247,242,255,0.9), rgba(241,233,255,0.9))"
                                        : isInteraction && !isDark
                                          ? "linear-gradient(140deg, rgba(224,242,254,0.9), rgba(219,234,254,0.9))"
                                          : undefined,
                              }}
                            >
                              {/* Header */}
                              <div className="flex items-start gap-3">
                                <div className="flex-1 space-y-1">
                                  <div
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.32em]"
                                    style={{
                                      backgroundColor: isTension
                                        ? isDark
                                          ? "rgba(168,85,247,0.2)"
                                          : "rgba(177,156,217,0.22)"
                                        : isInteraction
                                          ? isDark
                                            ? "rgba(59,130,246,0.2)"
                                            : "rgba(135,206,235,0.25)"
                                          : isDark
                                            ? `${theme.surface}30`
                                            : "#f1f5f9",
                                      color: isTension
                                        ? isDark
                                          ? "#e9d5ff"
                                          : NodeTextColors.tension
                                        : isInteraction
                                          ? isDark
                                            ? "#dbeafe"
                                            : NodeTextColors.interaction
                                          : isDark
                                            ? theme.textPrimary
                                            : "#1e293b",
                                    }}
                                  >
                                    {isTension ? (
                                      <Sword className="w-3 h-3 flex-shrink-0" />
                                    ) : isInteraction ? (
                                      <Users className="w-3 h-3 flex-shrink-0" />
                                    ) : null}
                                    <span>{rel.nodeLabel}</span>
                                  </div>
                                  {rel.nodeDescription &&
                                  String(rel.nodeDescription).trim() ? (
                                    <div
                                      className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                        isTension
                                          ? isDark
                                            ? "text-purple-200"
                                            : "text-purple-700"
                                          : isInteraction
                                            ? isDark
                                              ? "text-sky-200"
                                              : "text-sky-700"
                                            : isDark
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
                                  {connectedNodes.map(
                                    (connectedNode: any, index: number) => {
                                      const part = connectedNode?.part;
                                      const statement =
                                        connectedNode?.tensionDescription || "";
                                      if (!part) return null;

                                      return (
                                        <div
                                          key={index}
                                          className="rounded-lg px-3 py-2.5 shadow-sm hover:shadow-md transition"
                                          style={{
                                            backgroundColor: isDark
                                              ? "rgba(42, 46, 50, 0.75)"
                                              : theme.surface,
                                          }}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div
                                              className="text-sm font-semibold"
                                              style={{
                                                color: theme.textPrimary,
                                              }}
                                            >
                                              {part?.data?.label ||
                                                part?.data?.name ||
                                                "Unknown Part"}
                                              {part?.id === selectedPartId && (
                                                <span
                                                  className="ml-2 inline-block font-medium"
                                                  style={{
                                                    color: isInteraction
                                                      ? isDark
                                                        ? "#dbeafe"
                                                        : NodeTextColors.interaction
                                                      : isDark
                                                        ? "#e9d5ff"
                                                        : NodeTextColors.tension,
                                                    fontSize: "11px",
                                                    fontWeight: "500",
                                                    background: isInteraction
                                                      ? isDark
                                                        ? "rgba(59,130,246,0.2)"
                                                        : "#dbeafe"
                                                      : isDark
                                                        ? "rgba(168,85,247,0.2)"
                                                        : "#e8dff7",
                                                    borderRadius: "10px",
                                                    padding: "1px 5px",
                                                  }}
                                                >
                                                  current
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {statement && (
                                            <div
                                              className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap"
                                              style={{
                                                color: theme.textSecondary,
                                              }}
                                            >
                                              {statement}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="rounded-2xl border text-center py-8"
                        style={subCardStyle}
                      >
                        <Users
                          className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        />
                        <h3
                          className={`text-lg font-semibold mb-2 ${isDark ? "text-slate-100" : "text-slate-700"}`}
                        >
                          No relationships yet
                        </h3>
                        <p
                          className={
                            isDark ? "text-slate-400" : "text-slate-500"
                          }
                        >
                          No relationships have been created for this part.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                      isDark ? "bg-slate-950/30" : "bg-slate-900/20"
                    }`}
                  />
                  <div
                    className="relative w-full max-w-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`relative overflow-hidden rounded-[28px] border shadow-[0_30px_70px_rgba(15,23,42,0.36)]`}
                      style={
                        isDark
                          ? {
                              backgroundColor: theme.card,
                              borderColor: theme.border,
                            }
                          : {
                              borderColor: "rgba(226, 232, 240, 0.8)",
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                            }
                      }
                    >
                      <div className="relative px-8 pt-8 pb-6 space-y-7">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-3">
                            <span
                              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
                              style={{
                                ...(addingNeedsOrFears === "needs"
                                  ? {
                                      backgroundColor: isDark
                                        ? "rgba(123, 66, 226, 0.2)"
                                        : "rgba(123, 66, 226, 0.1)",
                                      color: isDark ? "#a78bfa" : "#7b42e2",
                                      border: isDark
                                        ? "1px solid rgba(123, 66, 226, 0.3)"
                                        : "1px solid rgba(123, 66, 226, 0.2)",
                                    }
                                  : {
                                      backgroundColor: isDark
                                        ? "rgba(247, 133, 133, 0.2)"
                                        : "rgba(247, 133, 133, 0.1)",
                                      color: isDark ? "#fca5a5" : "#f78585",
                                      border: isDark
                                        ? "1px solid rgba(247, 133, 133, 0.3)"
                                        : "1px solid rgba(247, 133, 133, 0.2)",
                                    }),
                              }}
                            >
                              {addingNeedsOrFears === "needs" ? (
                                <Heart size={14} />
                              ) : (
                                <Shield size={14} />
                              )}
                              {addingNeedsOrFears === "needs" ? "Need" : "Fear"}
                            </span>
                            <div>
                              <h3
                                className="text-2xl font-semibold"
                                style={{
                                  color: isDark ? theme.textPrimary : "#0f172a",
                                }}
                              >
                                Add a new{" "}
                                {addingNeedsOrFears === "needs"
                                  ? "need"
                                  : "fear"}{" "}
                                to{" "}
                                {(data.name as string) ||
                                  (data.label as string) ||
                                  "this part"}
                              </h3>
                              <p
                                className="mt-2 text-sm leading-relaxed"
                                style={{
                                  color: isDark
                                    ? theme.textSecondary
                                    : "#475569",
                                }}
                              >
                                {addingNeedsOrFears === "needs"
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
                            className="h-10 w-10 flex items-center justify-center rounded-full border transition-colors"
                            style={
                              isDark
                                ? {
                                    borderColor: theme.border,
                                    color: theme.textSecondary,
                                  }
                                : {
                                    borderColor: "#e2e8f0",
                                    color: "#000000",
                                  }
                            }
                            onMouseEnter={(e) => {
                              if (isDark) {
                                e.currentTarget.style.backgroundColor =
                                  theme.elevated;
                              } else {
                                e.currentTarget.style.backgroundColor =
                                  "#f1f5f9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                            aria-label="Close"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <textarea
                          ref={(el) => {
                            if (el) {
                              el.focus();
                              // Auto-resize textarea
                              el.style.height = "auto";
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          value={needsFearsInput}
                          onChange={(e) => {
                            setNeedsFearsInput(e.target.value);
                            // Auto-resize
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              needsFearsInput.trim()
                            ) {
                              e.preventDefault();
                              addListItem(
                                addingNeedsOrFears,
                                needsFearsInput.trim()
                              );
                              setNeedsFearsInput("");
                              setAddingNeedsOrFears(null);
                            }
                            if (e.key === "Escape") {
                              setAddingNeedsOrFears(null);
                              setNeedsFearsInput("");
                            }
                          }}
                          placeholder={`Describe ${addingNeedsOrFears === "needs" ? "what this part needs" : "what this part fears"}...`}
                          className="w-full min-h-[120px] resize-none rounded-xl px-5 py-4 text-sm leading-relaxed focus:outline-none shadow-inner"
                          style={
                            isDark
                              ? {
                                  backgroundColor: theme.surface,
                                  borderColor: "transparent",
                                  borderWidth: 0,
                                  color: theme.textPrimary,
                                }
                              : {
                                  backgroundColor: "#ffffff",
                                  borderColor: "transparent",
                                  borderWidth: 0,
                                  color: "#0f172a",
                                }
                          }
                          rows={4}
                        />
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={() => {
                              if (needsFearsInput.trim()) {
                                addListItem(
                                  addingNeedsOrFears,
                                  needsFearsInput.trim()
                                );
                                setNeedsFearsInput("");
                                setAddingNeedsOrFears(null);
                              }
                            }}
                            disabled={!needsFearsInput.trim()}
                            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            style={{
                              backgroundColor: needsFearsInput.trim()
                                ? addingNeedsOrFears === "needs"
                                  ? isDark
                                    ? "#6d28d9"
                                    : "#7b42e2"
                                  : isDark
                                    ? "#dc2626"
                                    : "#f78585"
                                : isDark
                                  ? "rgb(42, 46, 50)"
                                  : "#e2e8f0",
                              color: needsFearsInput.trim()
                                ? "#ffffff"
                                : isDark
                                  ? theme.textMuted
                                  : "#94a3b8",
                              border: "none",
                              ...(isDark
                                ? {}
                                : {
                                    borderTop: needsFearsInput.trim()
                                      ? undefined
                                      : "1px solid #00000012",
                                  }),
                              transition: "none !important",
                            }}
                            onMouseEnter={(e) => {
                              if (needsFearsInput.trim()) {
                                e.currentTarget.style.opacity = "0.9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (needsFearsInput.trim()) {
                                e.currentTarget.style.opacity = "1";
                              }
                            }}
                          >
                            Add{" "}
                            {addingNeedsOrFears === "needs" ? "Need" : "Fear"}
                          </button>
                        </div>

                        <div
                          className="flex items-center gap-3 flex-wrap"
                          style={{
                            color: isDark ? theme.textMuted : "#64748b",
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <kbd
                              className="px-2 py-1 rounded text-[10px] font-semibold text-slate-700 shadow-sm"
                              style={{
                                backgroundColor: "white",
                              }}
                            >
                              {isMac() ? "⏎" : "Enter"}
                            </kbd>
                            <span className="text-xs">Submit</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <kbd
                              className="px-2 py-1 rounded text-[10px] font-semibold text-slate-700 shadow-sm"
                              style={{
                                backgroundColor: "white",
                              }}
                            >
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
            </div>

            {/* Journal History Modal */}
            {showJournalHistoryModal && (
              <div
                className="fixed inset-0 flex items-center justify-center z-[60] p-4"
                onClick={() => setShowJournalHistoryModal(false)}
              >
                <div
                  className="absolute inset-0 pointer-events-none backdrop-blur-sm"
                  style={{
                    backgroundColor: isDark
                      ? `${theme.modal}f2`
                      : `${theme.modal}99`,
                  }}
                />
                <div
                  className="relative rounded-[24px] shadow-[0_20px_48px_rgba(15,23,42,0.26)] w-full max-w-4xl max-h-[85vh] mx-4 overflow-hidden flex flex-col border"
                  style={modalContainerStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="px-6 py-5 flex items-center justify-between"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(42, 46, 50, 0.75)"
                        : theme.surface,
                    }}
                  >
                    <div>
                      <h3
                        className={`text-xl font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        Journal History
                      </h3>
                      <p
                        className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {journalEntries.length}{" "}
                        {journalEntries.length === 1 ? "entry" : "entries"} for{" "}
                        {(data.name as string) ||
                          (data.label as string) ||
                          "this part"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowJournalHistoryModal(false)}
                      className={`p-2 rounded-full border ${
                        isDark
                          ? "border-slate-700 hover:bg-slate-900/60"
                          : "border-slate-200 hover:bg-slate-100"
                      }`}
                      style={
                        isDark
                          ? {
                              color: "#cbd5e1",
                            }
                          : {
                              color: "#000000",
                            }
                      }
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

                        // Check if entry was updated (different from created)
                        const wasUpdated =
                          entry.updatedAt &&
                          entry.createdAt &&
                          new Date(entry.updatedAt).getTime() !==
                            new Date(entry.createdAt).getTime();

                        // Get content preview
                        const contentPreview = (() => {
                          if (isTextThread) {
                            try {
                              const parsed = JSON.parse(entry.content);
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                // Get part nodes for speaker name resolution
                                const partNodesMap = new Map(
                                  nodes
                                    .filter((n) => n.type === "part")
                                    .map((n) => [n.id, n])
                                );

                                return (
                                  parsed
                                    .slice(0, 8)
                                    .map((msg: any) => {
                                      let speakerLabel = "Unknown";
                                      if (msg.speakerId === "self") {
                                        speakerLabel = "Self";
                                      } else if (
                                        msg.speakerId === "unknown" ||
                                        msg.speakerId === "?"
                                      ) {
                                        speakerLabel = "Unknown";
                                      } else {
                                        const partNode = partNodesMap.get(
                                          msg.speakerId
                                        );
                                        speakerLabel =
                                          partNode?.data?.label ||
                                          partNode?.data?.name ||
                                          msg.speakerId;
                                      }
                                      return `${speakerLabel}: ${msg.text || ""}`;
                                    })
                                    .join("\n") +
                                  (parsed.length > 8
                                    ? `\n... (${parsed.length - 8} more messages)`
                                    : "")
                                );
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
                            text = (
                              temp.textContent ||
                              temp.innerText ||
                              ""
                            ).trim();
                          } else {
                            // Server-side fallback
                            text = text
                              .replace(/<[^>]+>/g, " ")
                              .replace(/\s+/g, " ")
                              .trim();
                          }
                          return text.length > 500
                            ? text.substring(0, 500) + "..."
                            : text;
                        })();

                        // Get word/character count
                        const wordCount = isTextThread
                          ? (() => {
                              try {
                                const parsed = JSON.parse(entry.content);
                                if (Array.isArray(parsed)) {
                                  return parsed.reduce(
                                    (acc: number, msg: any) => {
                                      return (
                                        acc +
                                        (msg.text || "")
                                          .split(/\s+/)
                                          .filter((w: string) => w.length > 0)
                                          .length
                                      );
                                    },
                                    0
                                  );
                                }
                              } catch {}
                              return 0;
                            })()
                          : (entry.content || "")
                              .split(/\s+/)
                              .filter((w: string) => w.length > 0).length;
                        const charCount = entry.content?.length || 0;

                        return (
                          <div
                            key={entry.id}
                            className="rounded-2xl p-5 shadow-sm shadow-inner hover:shadow-md transition-shadow"
                            style={{
                              ...subCardStyle,
                              backgroundColor: isDark
                                ? "rgb(33, 37, 41)"
                                : "white",
                            }}
                          >
                            {/* Header with dates and actions */}
                            <div className="flex items-start justify-between mb-3 gap-4">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Clock
                                    className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                  />
                                  <span
                                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    Created:{" "}
                                    {new Date(
                                      entry.createdAt
                                    ).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(
                                      entry.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {wasUpdated && (
                                    <>
                                      <span
                                        className={
                                          isDark
                                            ? "text-slate-600"
                                            : "text-slate-400"
                                        }
                                      >
                                        •
                                      </span>
                                      <span
                                        className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                      >
                                        Updated:{" "}
                                        {new Date(
                                          entry.updatedAt
                                        ).toLocaleDateString()}{" "}
                                        at{" "}
                                        {new Date(
                                          entry.updatedAt
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Entry type and metadata */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                                      isTextThread
                                        ? isDark
                                          ? "bg-purple-900/40 text-purple-200"
                                          : "bg-purple-50 text-purple-700"
                                        : isDark
                                          ? "bg-blue-900/40 text-blue-200"
                                          : "bg-blue-50 text-blue-700"
                                    }`}
                                  >
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
                                  <span
                                    className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                  >
                                    {wordCount} words •{" "}
                                    {charCount.toLocaleString()} chars
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    // Open this entry in the main journal drawer
                                    if (selectedPartId && partNode) {
                                      // Detect mode from content
                                      const detectMode = (
                                        content: string
                                      ): "normal" | "textThread" => {
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
                                        if (typeof window === "undefined")
                                          return;

                                        const store =
                                          useJournalStore.getState();
                                        store.loadEntry({
                                          entryId: entry.id,
                                          content: entry.content,
                                          speakers: Array.isArray(
                                            entry.speakers
                                          )
                                            ? entry.speakers
                                            : [],
                                        });

                                        // Dispatch a custom event to set the mode
                                        try {
                                          const event = createCustomEvent(
                                            "journal-set-mode",
                                            { mode }
                                          );
                                          if (
                                            event &&
                                            typeof window !== "undefined"
                                          ) {
                                            window.dispatchEvent(event);
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Failed to dispatch journal-set-mode event:",
                                            error
                                          );
                                        }
                                      }, 100);

                                      setShowJournalHistoryModal(false);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm"
                                  style={{
                                    backgroundColor: isDark
                                      ? "rgb(42, 46, 50)"
                                      : "white",
                                    border: "none",
                                    ...(isDark
                                      ? {
                                          borderTop:
                                            "1px solid rgba(0, 0, 0, 0.15)",
                                        }
                                      : { borderTop: "1px solid #00000012" }),
                                    color: isDark
                                      ? theme.textPrimary
                                      : "#475569",
                                    transition: "none !important",
                                    WebkitTransition: "none !important",
                                    MozTransition: "none !important",
                                    OTransition: "none !important",
                                    msTransition: "none !important",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      isDark ? theme.buttonHover : "#f1f5f9";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      isDark ? "rgb(42, 46, 50)" : "white";
                                  }}
                                  title="Open in journal"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>Open</span>
                                </button>
                                <button
                                  onClick={() =>
                                    extractImpressionsFromEntry(entry.id)
                                  }
                                  disabled={true}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed opacity-50"
                                  style={{
                                    backgroundColor: isDark
                                      ? theme.surface
                                      : "#e2e8f0",
                                    color: isDark ? theme.textMuted : "#94a3b8",
                                  }}
                                  title="Coming soon"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Extract</span>
                                </button>
                                <button
                                  onClick={() => deleteJournalEntry(entry.id)}
                                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                                    isDark
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
                            <div
                              className={`whitespace-pre-wrap text-sm leading-relaxed max-h-64 overflow-y-auto ${
                                isDark ? "text-slate-300" : "text-slate-700"
                              }`}
                              style={{
                                border: "none",
                                padding: "10px",
                                borderRadius: "10px",
                                ...(isDark
                                  ? { background: "#272b2f" }
                                  : { background: "#f8fafc" }),
                              }}
                            >
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartDetailPanel;
