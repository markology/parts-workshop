"use client";

import React, { useMemo } from "react";
import {
  Brain,
  Heart,
  Shield,
  User,
  Calendar,
} from "lucide-react";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import {
  ConnectedNodeType,
  ImpressionNode,
  PartNodeData,
  TensionNodeData,
  WorkshopNode,
} from "@/features/workspace/types/Nodes";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useLoadMap } from "@/features/workspace/state/hooks/useLoadMap";

interface ContextPanelProps {
  journalTarget: { type: "global" } | {
    type: "node";
    nodeId: string;
    nodeType: ImpressionType | "part" | "tension" | "interaction";
    title: string;
  } | null;
  targetNode: WorkshopNode | null;
  nodeId: string | undefined;
  nodes: WorkshopNode[];
  flowNodesContext: any;
}

export default function ContextPanel({
  journalTarget,
  targetNode,
  nodeId,
  nodes,
  flowNodesContext,
}: ContextPanelProps) {
  const theme = useTheme();
  const mapId = useWorkingStore((s) => s.mapId);
  const { data: mapData } = useLoadMap(mapId || "");

  // Get part nodes for global journal info
  const partNodes = useMemo(() => {
    return nodes.filter((node) => node.type === "part");
  }, [nodes]);

  const partNames = useMemo(() => {
    return partNodes.map((node) => {
      const data = node.data as PartNodeData;
      return data?.label || "Unnamed Part";
    });
  }, [partNodes]);

  // Format creation date
  const formattedCreatedAt = useMemo(() => {
    if (!mapData?.createdAt) return null;
    try {
      const date = new Date(mapData.createdAt);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }, [mapData?.createdAt]);

  if (!journalTarget) {
    return (
      <div
        className="space-y-3 text-sm"
        style={{ color: theme.textSecondary }}
      >
        <p>This journal entry is not linked to a specific node.</p>
        <p>
          Open a part, impression, or interaction to display its context here.
        </p>
      </div>
    );
  }

  // Handle global journal
  if (journalTarget.type === "global") {
    return (
      <div
        className="space-y-6 text-sm"
        style={{ color: theme.textSecondary }}
      >
        <section className="p-0">
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: theme.textPrimary }}
          >
            Global Journal
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: theme.textSecondary }}
          >
            This journal is attached to the map itself, not to any specific part or node.
          </p>

          <div className="space-y-4">
            {/* Part Count */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textMuted }}
              >
                Parts Mapped:
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: theme.textPrimary }}
              >
                {partNodes.length}
              </span>
            </div>

            {/* Part Names List */}
            {partNames.length > 0 && (
              <div
                className="rounded-xl px-3.5 py-3 shadow-sm"
                style={{
                  backgroundColor: theme.surface,
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: theme.textMuted }}
                >
                  Part Names
                </p>
                <ul className="space-y-1.5">
                  {partNames.map((name, idx) => (
                    <li
                      key={idx}
                      className="text-sm"
                      style={{ color: theme.textPrimary }}
                    >
                      • {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Creation Date */}
            {formattedCreatedAt && (
              <div
                className="rounded-xl px-3.5 py-3 shadow-sm"
                style={{
                  backgroundColor: theme.surface,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" style={{ color: theme.textMuted }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: theme.textMuted }}
                  >
                    Map Created
                  </span>
                </div>
                <p
                  className="text-sm"
                  style={{ color: theme.textPrimary }}
                >
                  {formattedCreatedAt}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Check if we have the target node first - if we do, we can render it even without flowNodesContext
  if (!targetNode) {
    // Only show the "context not available" message if we also don't have any nodes
    if (!flowNodesContext && nodes.length === 0) {
      return (
        <div className="space-y-3 text-sm text-[var(--theme-text-secondary)]">
          <p className="font-semibold text-[var(--theme-text-primary)]">
            Node context is not available.
          </p>
          <p>The workspace may not be fully loaded yet.</p>
          <p className="text-xs mt-2 text-[var(--theme-text-muted)]">
            Make sure you&apos;re viewing a workspace with nodes.
          </p>
          <div
            className="mt-3 rounded-lg border p-3 text-xs"
            style={{
              backgroundColor: theme.warning + "1a",
              borderColor: theme.warning + "33",
            }}
          >
            <p
              className="font-semibold mb-1"
              style={{ color: theme.warning }}
            >
              Debug Info:
            </p>
            <p className="text-[var(--theme-text-secondary)]">
              flowNodesContext: {flowNodesContext ? "available" : "null"}
            </p>
            <p className="text-[var(--theme-text-secondary)]">
              nodes.length: {nodes.length}
            </p>
            <p className="text-[var(--theme-text-secondary)]">
              nodeId: {nodeId || "none"}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div
        className="space-y-3 text-sm"
        style={{ color: theme.textSecondary }}
      >
        <p className="font-semibold" style={{ color: theme.textPrimary }}>
          We couldn&apos;t find this node in the current workspace.
        </p>
        <p>It may have been removed or moved to another map.</p>
        {nodeId && (
          <p className="text-xs mt-2 text-[var(--theme-text-muted)]">
            Looking for node:{" "}
            <code className="px-1 rounded bg-[var(--theme-surface)]">
              {nodeId}
            </code>
          </p>
        )}
        {nodes.length > 0 && (
          <div
            className="mt-3 rounded-lg border p-3 text-xs"
            style={{
              backgroundColor: theme.info + "1a",
              borderColor: theme.info + "33",
            }}
          >
            <p className="font-semibold mb-2" style={{ color: theme.info }}>
              Found {nodes.length} node{nodes.length !== 1 ? "s" : ""} in
              workspace:
            </p>
            <ul className="space-y-1 text-[var(--theme-text-secondary)]">
              {nodes.slice(0, 5).map((n) => (
                <li key={n.id}>
                  <code className="px-1 rounded bg-[var(--theme-surface)]">
                    {n.id}
                  </code>{" "}
                  ({n.type})
                </li>
              ))}
              {nodes.length > 5 && (
                <li className="text-[var(--theme-text-muted)]">
                  ... and {nodes.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}
        {nodes.length === 0 && (
          <div
            className="mt-3 rounded-lg border p-3 text-xs"
            style={{
              backgroundColor: theme.error + "1a",
              borderColor: theme.error + "33",
            }}
          >
            <p className="font-semibold" style={{ color: theme.error }}>
              No nodes found in workspace
            </p>
            <p style={{ color: theme.textSecondary }}>
              The workspace appears to be empty or not loaded.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (targetNode.type === "part") {
    const data = targetNode.data as PartNodeData;

    // Flatten all impressions and sort by recency (most recent first)
    const impressions = ImpressionList.flatMap((impressionType) => {
      const impressionData =
        (data[ImpressionTextType[impressionType]] as ImpressionNode[]) || [];
      return impressionData.map((imp) => ({
        ...imp,
        impressionType,
        addedAt:
          imp.data?.addedAt || imp.data?.createdAt || imp.data?.timestamp,
      }));
    });

    const allImpressions = impressions.sort((a, b) => {
      const dateA =
        typeof a.addedAt === "string"
          ? new Date(a.addedAt).getTime()
          : Number(a.addedAt || 0);
      const dateB =
        typeof b.addedAt === "string"
          ? new Date(b.addedAt).getTime()
          : Number(b.addedAt || 0);
      return dateB - dateA; // Most recent first
    });

    const metadata = [
      data.name && data.name !== data.label
        ? { label: "Also known as", value: data.name }
        : null,
    ].filter(Boolean) as { label: string; value: string | number }[];

    const hasImpressions = ImpressionList.some((impression) => {
      const impressionData =
        (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];
      return impressionData.length > 0;
    });

    return (
      <div
        className="space-y-6 text-sm"
        style={{ color: theme.textSecondary }}
      >
        <section className="p-0">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3
                className="text-xl font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {data.label}
              </h3>
              <div
                className="mt-3 flex flex-wrap items-center gap-2 text-xs"
                style={{ color: theme.textMuted }}
              >
                {(() => {
                  const partType =
                    data.partType === "custom"
                      ? data.customPartType
                      : data.partType;
                  const mapping: Record<
                    string,
                    { icon: React.ReactNode; className: string }
                  > = {
                    manager: {
                      icon: <Brain className="w-3.5 h-3.5" />,
                      className:
                        "theme-light:bg-sky-100 theme-light:text-sky-600 theme-dark:bg-sky-500/15 theme-dark:text-sky-100",
                    },
                    firefighter: {
                      icon: <Shield className="w-3.5 h-3.5" />,
                      className:
                        "theme-light:bg-rose-100 theme-light:text-rose-600 theme-dark:bg-rose-500/15 theme-dark:text-rose-100",
                    },
                    exile: {
                      icon: <Heart className="w-3.5 h-3.5" />,
                      className:
                        "theme-light:bg-purple-100 theme-light:text-purple-600 theme-dark:bg-purple-500/15 theme-dark:text-purple-100",
                    },
                  };

                  const pill =
                    partType && mapping[partType]
                      ? mapping[partType]
                      : {
                          icon: <User className="w-3.5 h-3.5" />,
                          className:
                            "theme-light:bg-slate-100 theme-light:text-slate-600 theme-dark:bg-slate-800/60 theme-dark:text-slate-200",
                        };

                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize shadow-sm ${pill.className}`}
                    >
                      {pill.icon}
                      {partType || "No type set"}
                    </span>
                  );
                })()}
                {data.age && String(data.age).toLowerCase() !== "unknown" && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 font-medium shadow-sm"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.textMuted,
                    }}
                  >
                    Age{" "}
                    <span
                      className="font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {data.age}
                    </span>
                  </span>
                )}
                {data.gender && data.gender.toLowerCase() !== "unknown" && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 font-medium shadow-sm"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.textMuted,
                    }}
                  >
                    Gender{" "}
                    <span
                      className="font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {data.gender}
                    </span>
                  </span>
                )}
                {metadata.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 font-medium shadow-sm"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.textMuted,
                    }}
                  >
                    {item.label}{" "}
                    <span
                      className="font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {item.value}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {data.image && (
              <div
                className="relative h-24 w-24 overflow-hidden rounded-xl border shadow-sm"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                }}
              >
                <img
                  src={data.image}
                  alt={`${data.label} image`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          {data.scratchpad?.trim() && (
            <div
              className="rounded-xl px-3.5 py-3 text-xs leading-relaxed shadow-sm"
              style={{
                backgroundColor: theme.surface,
                color: theme.textSecondary,
                marginTop: "10px",
              }}
            >
              <span
                className="font-medium"
                style={{ color: theme.textMuted }}
              >
                Description{" "}
              </span>
              <span style={{ color: theme.textPrimary }}>
                {data.scratchpad}
              </span>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: theme.textMuted }}
          >
            Impressions
          </p>
          {hasImpressions ? (
            <div className="flex flex-wrap gap-2">
              {allImpressions.map((item) => {
                const impressionType = item.impressionType as ImpressionType;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border px-3 py-2 shadow-sm"
                    style={{
                      backgroundColor: `var(--theme-impression-${impressionType}-bg)`,
                      borderColor: "transparent",
                      color: `var(--theme-impression-${impressionType}-text)`,
                    }}
                  >
                    <span className="font-medium text-xs break-words">
                      {item.data?.label || "No label"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-xl border px-3 py-2"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
              }}
            >
              <span className="text-xs" style={{ color: theme.textMuted }}>
                No impressions
              </span>
            </div>
          )}
        </section>

        {data.needs && data.needs.length > 0 && (
          <section className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.textMuted }}
            >
              Key Needs
            </p>
            <ul className="flex flex-wrap gap-2">
              {data.needs
                .filter(Boolean)
                .slice(0, 6)
                .map((need, idx) => (
                  <li
                    key={`${need}-${idx}`}
                    className="rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                    }}
                  >
                    {need}
                  </li>
                ))}
            </ul>
          </section>
        )}

        {data.fears && data.fears.length > 0 && (
          <section className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.textMuted }}
            >
              Key Fears
            </p>
            <ul className="flex flex-wrap gap-2">
              {data.fears
                .filter(Boolean)
                .slice(0, 6)
                .map((fear, idx) => (
                  <li
                    key={`${fear}-${idx}`}
                    className="rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                    }}
                  >
                    {fear}
                  </li>
                ))}
            </ul>
          </section>
        )}

        {data.insights && data.insights.length > 0 && (
          <section className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.textMuted }}
            >
              Insights
            </p>
            <ul className="flex flex-col gap-1.5">
              {data.insights
                .filter(Boolean)
                .slice(0, 4)
                .map((insight, idx) => (
                  <li
                    key={`${insight}-${idx}`}
                    className="rounded-lg px-3 py-1.5 text-sm shadow-sm"
                    style={{
                      backgroundColor: theme.card,
                      color: theme.textPrimary,
                    }}
                  >
                    {insight}
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (
    targetNode.type === "tension" ||
    targetNode.type === "interaction" ||
    targetNode.type === "relationship"
  ) {
    // Relationship nodes might have TensionNodeData structure
    const data = targetNode.data as
      | TensionNodeData
      | {
          connectedNodes?: ConnectedNodeType[];
          relationshipType?: string;
          label?: string;
          [key: string]: unknown;
        };

    const connectedNodes: ConnectedNodeType[] = Array.isArray(
      (data as TensionNodeData).connectedNodes
    )
      ? ((data as TensionNodeData).connectedNodes as ConnectedNodeType[])
      : [];

    // Get the actual part nodes from the workspace to ensure we have full data
    const enrichedConnectedNodes = connectedNodes.map(
      ({ part, tensionDescription }) => {
        const actualPartNode = nodes.find(
          (n) => n.id === part.id && n.type === "part"
        );
        return {
          part: actualPartNode || part,
          tensionDescription,
          isFromWorkspace: !!actualPartNode,
        };
      }
    );

    const relationshipType =
      (data as TensionNodeData).relationshipType ||
      (targetNode.type === "relationship"
        ? "relationship"
        : targetNode.type) ||
      "interaction";
    const displayLabel =
      data.label ||
      (targetNode.data as { label?: string })?.label ||
      "No summary yet";

    return (
      <div
        className="space-y-3 text-sm"
        style={{ color: theme.textSecondary }}
      >
        {enrichedConnectedNodes.length === 0 ? (
          <div className="space-y-2">
            <p
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: theme.surface,
                color: theme.textSecondary,
              }}
            >
              No parts linked to this {relationshipType} yet.
            </p>
            <div
              className="rounded-lg border p-3 text-xs"
              style={{
                backgroundColor: theme.warning + "1a",
                borderColor: theme.warning + "33",
              }}
            >
              <p
                className="font-semibold mb-1"
                style={{ color: theme.warning }}
              >
                Debug Info:
              </p>
              <p style={{ color: theme.textSecondary }}>
                connectedNodes extracted: {connectedNodes.length}
              </p>
              <p style={{ color: theme.textSecondary }}>
                data.connectedNodes type:{" "}
                {typeof (data as TensionNodeData).connectedNodes}
              </p>
              <p style={{ color: theme.textSecondary }}>
                data.connectedNodes isArray:{" "}
                {Array.isArray((data as TensionNodeData).connectedNodes)}
              </p>
              <p style={{ color: theme.textSecondary }}>
                nodeType: {targetNode.type}
              </p>
              <p style={{ color: theme.textSecondary }}>
                data keys: {Object.keys(data).join(", ")}
              </p>
            </div>
          </div>
        ) : (
          enrichedConnectedNodes.map(
            ({ part, tensionDescription, isFromWorkspace }) => {
              const partData = part.data as PartNodeData | undefined;
              const partLabel =
                partData?.label || part.data?.label || "Unnamed part";

              const partType =
                partData?.partType === "custom"
                  ? partData.customPartType
                  : partData?.partType;
              const partTypeMapping: Record<
                string,
                { icon: React.ReactNode; className: string }
              > = {
                manager: {
                  icon: <Brain className="w-3.5 h-3.5" />,
                  className:
                    "theme-light:bg-sky-100 theme-light:text-sky-600 theme-dark:bg-sky-500/15 theme-dark:text-sky-100",
                },
                firefighter: {
                  icon: <Shield className="w-3.5 h-3.5" />,
                  className:
                    "theme-light:bg-rose-100 theme-light:text-rose-600 theme-dark:bg-rose-500/15 theme-dark:text-rose-100",
                },
                exile: {
                  icon: <Heart className="w-3.5 h-3.5" />,
                  className:
                    "theme-light:bg-purple-100 theme-light:text-purple-600 theme-dark:bg-purple-500/15 theme-dark:text-purple-100",
                },
              };

              const partTypePill =
                partType && partTypeMapping[partType]
                  ? partTypeMapping[partType]
                  : {
                      icon: <User className="w-3.5 h-3.5" />,
                      className:
                        "theme-light:bg-slate-100 theme-light:text-slate-600 theme-dark:bg-slate-800/60 theme-dark:text-slate-200",
                    };

              return (
                <div
                  key={part.id}
                  className="rounded-xl border px-3.5 py-3 shadow-sm"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className="font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {partLabel}
                    </p>
                  </div>
                  {tensionDescription ? (
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: theme.textSecondary }}
                    >
                      {tensionDescription}
                    </p>
                  ) : (
                    <p
                      className="mt-1 text-xs uppercase tracking-wide"
                      style={{ color: theme.textMuted }}
                    >
                      No notes yet
                    </p>
                  )}
                  {partData && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize shadow-sm ${partTypePill.className}`}
                      >
                        {partTypePill.icon}
                        {partType || "No type set"}
                      </span>
                    </div>
                  )}
                </div>
              );
            }
          )
        )}
      </div>
    );
  }

  if (ImpressionList.includes(targetNode.type as ImpressionType)) {
    const label = (targetNode.data as { label?: string })?.label;
    const impressionType = targetNode.type as ImpressionType;

    return (
      <div
        className="text-left rounded-xl px-3 pt-2 pb-3 text-sm font-medium shadow-sm break-words flex flex-col gap-2"
        style={{
          backgroundColor: `var(--theme-impression-${impressionType}-bg)`,
          color: `var(--theme-impression-${impressionType}-text)`,
        }}
      >
        <strong
          className="text-sm font-semibold"
          style={{
            color: `var(--theme-impression-${impressionType}-title)`,
          }}
        >
          {ImpressionTextType[impressionType] || impressionType}
        </strong>

        <div className="text-sm leading-relaxed mt-2">
          {label || "No text added to this impression yet."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm" style={{ color: theme.textSecondary }}>
      <p>Node context is available for parts, impressions, and tensions.</p>
    </div>
  );
}

