import { ImpressionNode } from "@/features/workspace/types/Nodes";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { NodeBackgroundColors, NodeTextColors } from "@/features/workspace/constants/Nodes";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

interface CompactImpressionBucketProps {
  type: ImpressionType | "custom";
  customType?: string;
  impressions: ImpressionNode[];
  partId: string;
  onAddImpression?: (type: ImpressionType, customType?: string) => void;
  onRemoveImpression?: (impressionId: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const CompactImpressionBucket = ({
  type,
  customType,
  impressions,
  partId,
  onAddImpression,
  onRemoveImpression,
  isExpanded = false,
  onToggleExpanded,
}: CompactImpressionBucketProps) => {
  const displayName = customType || type;
  const impressionCount = impressions.length;

  return (
    <div className="compact-impression-bucket border border-gray-200 rounded-lg p-2 mb-2 bg-gray-50">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-600" />
          ) : (
            <ChevronRight size={16} className="text-gray-600" />
          )}
          <span className="font-medium text-sm text-gray-700">
            {displayName}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
            {impressionCount}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddImpression?.(type as ImpressionType, customType);
          }}
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
        >
          <Plus size={14} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-2 space-y-1">
          {impressions.map((impression) => (
            <div
              key={impression.id}
              className="flex items-center justify-between p-2 rounded text-sm bg-white border border-gray-200"
            >
              <span className="flex-1 text-gray-800">{impression.data.label}</span>
              <button
                onClick={() => onRemoveImpression?.(impression.id)}
                className="text-gray-500 hover:text-red-500 text-xs"
              >
                ×
              </button>
            </div>
          ))}
          {impressions.length === 0 && (
            <div className="text-sm italic p-2 text-gray-500">
              No impressions yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactImpressionBucket;