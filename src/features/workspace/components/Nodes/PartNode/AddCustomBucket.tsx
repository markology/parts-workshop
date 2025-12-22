import { useState } from "react";
import { Plus, X } from "lucide-react";

interface AddCustomBucketProps {
  onAddBucket: (bucketName: string) => void;
}

const AddCustomBucket = ({ onAddBucket }: AddCustomBucketProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [bucketName, setBucketName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bucketName.trim()) {
      onAddBucket(bucketName.trim());
      setBucketName("");
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setBucketName("");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 p-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 w-full"
      >
        <Plus size={16} />
        Add Custom Bucket
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={bucketName}
        onChange={(e) => setBucketName(e.target.value)}
        placeholder="Bucket name"
        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
        autoFocus
      />
      <button
        type="submit"
        className="p-1 text-green-600 hover:text-green-800"
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="p-1 text-red-600 hover:text-red-800"
      >
        <X size={16} />
      </button>
    </form>
  );
};

export default AddCustomBucket;
