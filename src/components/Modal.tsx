"use client";

import { X } from "lucide-react";
import React, { useRef } from "react";

const Modal = ({
  black,
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
  black?: boolean;
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
      className="fixed inset-0 z-76 flex items-center justify-center modal-overlay"
      style={{ 
        background: black ? "black" : "rgba(0,0,0,0.5)",
        backdropFilter: black ? "none" : "blur(2px)",
        WebkitBackdropFilter: black ? "none" : "blur(2px)",
      }}
    >
      <div
        ref={modalRef}
        className="rounded p-8 relative"
        style={{ width: width ?? "650px" }}
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
