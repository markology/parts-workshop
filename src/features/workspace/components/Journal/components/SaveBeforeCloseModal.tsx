"use client";

import Modal from "@/components/Modal";
import { useTheme } from "@/features/workspace/hooks/useTheme";

interface SaveBeforeCloseModalProps {
  show: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onDontSave: () => void;
}

export default function SaveBeforeCloseModal({
  show,
  isSaving,
  onClose,
  onSave,
  onDontSave,
}: SaveBeforeCloseModalProps) {
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
              Save before closing?
            </div>
            <div
              className="mt-1 text-sm leading-relaxed"
              style={{ color: theme.textSecondary }}
            >
              You have unsaved changes. Would you like to save them before
              closing?
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--theme-sub-button)",
              color: "var(--theme-text-primary)",
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onDontSave}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--theme-sub-button)",
              color: "var(--theme-text-primary)",
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Don't Save
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onSave}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: theme.info,
              color: "#fff",
              opacity: isSaving ? 0.75 : 1,
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

