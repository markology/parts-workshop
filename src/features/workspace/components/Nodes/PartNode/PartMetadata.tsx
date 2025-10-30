import { PartNodeData, PartType } from "@/features/workspace/types/Nodes";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useState } from "react";
import { Edit2, Save, X } from "lucide-react";

interface PartMetadataProps {
  data: PartNodeData;
  partId: string;
}

const PartMetadata = ({ data, partId }: PartMetadataProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    age: data.age?.toString() || "",
    gender: data.gender || "",
    partType: data.partType,
    customPartType: data.customPartType || "",
  });

  const { updateNode } = useFlowNodesContext();
  const setIsEditingGlobal = useUIStore((s) => s.setIsEditing);
  const { getNode } = useReactFlow();

  const handleSave = useCallback(() => {
    const node = getNode(partId);
    if (node?.data) {
      updateNode<PartNodeData>(partId, {
        data: {
          ...node.data,
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender || undefined,
          partType: formData.partType,
          customPartType: formData.partType === "custom" ? formData.customPartType : undefined,
        },
      });
    }
    setIsEditing(false);
    setIsEditingGlobal(false);
  }, [getNode, partId, updateNode, formData, setIsEditingGlobal]);

  const handleCancel = useCallback(() => {
    setFormData({
      age: data.age?.toString() || "",
      gender: data.gender || "",
      partType: data.partType,
      customPartType: data.customPartType || "",
    });
    setIsEditing(false);
    setIsEditingGlobal(false);
  }, [data, setIsEditingGlobal]);

  const partTypes: { value: PartType; label: string }[] = [
    { value: "manager", label: "Manager" },
    { value: "firefighter", label: "Firefighter" },
    { value: "exile", label: "Exile" },
    { value: "custom", label: "Custom" },
  ];

  if (!isEditing) {
    return (
      <div className="part-metadata bg-gray-50 p-3 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-700">Part Details</h3>
          <button
            onClick={() => {
              setIsEditing(true);
              setIsEditingGlobal(true);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Edit2 size={14} />
          </button>
        </div>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Type:</span>{" "}
            <span className="capitalize">
              {data.partType === "custom" && data.customPartType
                ? data.customPartType
                : data.partType}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="part-metadata bg-gray-50 p-3 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-700">Part Details</h3>
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:text-green-800"
          >
            <Save size={14} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Part Type
          </label>
          <select
            value={formData.partType}
            onChange={(e) => setFormData({ ...formData, partType: e.target.value as PartType })}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          >
            {partTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {formData.partType === "custom" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Custom Type
            </label>
            <input
              type="text"
              value={formData.customPartType}
              onChange={(e) => setFormData({ ...formData, customPartType: e.target.value })}
              placeholder="Enter custom part type"
              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PartMetadata;
