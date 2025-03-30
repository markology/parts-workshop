import React from "react";
import { Trash2 } from "lucide-react";

type TrashBucketProps = {
  onDropItem: (item: { type: string; id: string }) => void;
};

const TrashCan: React.FC<TrashBucketProps> = ({ onDropItem }) => {
  //   const [isHover];
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("handling drop");
    e.preventDefault();
    e.stopPropagation();
    // Retrieve the custom drag data
    const data = e.dataTransfer.getData("application/my-app");
    if (data) {
      try {
        const item = JSON.parse(data);
        onDropItem(item);
      } catch (error) {
        console.error("Invalid drop data", error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("dragging over");
    e.preventDefault();
    // Show a move cursor or highlight the trash bucket
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div
      onMouseOver={() => console.log("mouse onMouseOver")}
      onMouseDown={() => console.log("mouse down")}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        width: "60px",
        height: "60px",
        position: "fixed", // or absolute if inside a container
        top: "20px",
        right: "20px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 1000,
        background: "#0000003b",
      }}
      title="Drop here to delete"
      id="trash-bucket"
    >
      <Trash2 color="white" strokeWidth={2} size={30} />
    </div>
  );
};

export default TrashCan;
