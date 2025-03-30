import { X } from "lucide-react";
import React, { useRef } from "react";

const Modal = ({
  show,
  onClose,
  children,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!show) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000db] "
    >
      <div ref={modalRef} className="rounded p-8 w-[650px] relative ml-[250px]">
        <button
          onClick={onClose}
          className="absolute top-0 right-2 text-gray-500 hover:text-black"
        >
          <X strokeWidth={2} size={30} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
