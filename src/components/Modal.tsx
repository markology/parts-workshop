"use client";

import { X } from "lucide-react";
import React, { useRef } from "react";

const Modal = ({
  show,
  onClose,
  children,
  width,
  full = false,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string | number;
  full?: boolean;
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
      id="modal-overlay"
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: full ? "black" : "" }}
    >
      <div
        ref={modalRef}
        className={`rounded p-8 relative ${full ? "" : "ml-[250px]"}`}
        style={{ width: width ? width : "650px" }}
      >
        <button
          onClick={onClose}
          className="absolute top-0 right-2  hover:text-black"
        >
          <X className="text-white" strokeWidth={2} size={30} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
