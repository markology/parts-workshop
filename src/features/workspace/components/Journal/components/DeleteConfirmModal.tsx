"use client";

import Modal from "@/components/Modal";
import { useTheme } from "@/features/workspace/hooks/useTheme";

interface DeleteConfirmModalProps {
  show: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  show,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const theme = useTheme();

  return (
    <Modal show={show} onClose={onClose} width="520px">
      <div
        className="rounded-2xl border shadow-xl p-6"
        style={{
          backgroundColor: theme.card,
          borderColor: "var(--theme-border-subtle)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className="text-base font-semibold"
              style={{ color: theme.textPrimary }}
            >
              Delete journal entry?
            </div>
            <div
              className="mt-1 text-sm leading-relaxed"
              style={{ color: theme.textSecondary }}
            >
              This can't be undone.
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--theme-sub-button)",
              color: "var(--theme-text-primary)",
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: theme.error,
              color: "#fff",
              opacity: isDeleting ? 0.75 : 1,
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

