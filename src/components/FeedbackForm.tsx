import { useSendFeedback } from "@/features/workspace/hooks/useSendFeedback";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { Loader2 } from "lucide-react";

export default function FeedbackPopup() {
  const [message, setMessage] = useState("");
  const [sendAnonymously, setSendAnonymously] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const { darkMode } = useThemeContext();
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: sendFeedback } = useSendFeedback();

  // Autofocus message input when form opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Feedback message cannot be empty");
      return;
    }

    setIsSubmitting(true);
    sendFeedback(
      {
        name: sendAnonymously ? "" : (session?.user?.name || ""),
        message,
        userEmail: sendAnonymously ? undefined : (session?.user?.email || undefined),
        userId: sendAnonymously ? undefined : session?.user?.id,
      },
      {
        onSuccess: () => {
          toast.success("Feedback sent. Thank you!");
          setMessage("");
          setSendAnonymously(false);
          setIsSubmitting(false);
        },
        onError: () => {
          toast.error("Failed to send feedback. Try again later.");
          setIsSubmitting(false);
        },
      }
    );
  };

  const containerStyle = {
    backgroundColor: theme.modal,
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  const headerStyle = {
    backgroundColor: theme.elevated,
    borderColor: theme.border,
  };

  const cardStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  };

  const textareaStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  const toggleContainerStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  };

  const footerStyle = {
    backgroundColor: theme.elevated,
    borderColor: theme.border,
  };

  return (
    <div
      className="overflow-hidden w-full max-w-[520px] min-h-[520px] rounded-[28px] border shadow-[0_22px_48px_rgba(15,23,42,0.18)] flex flex-col"
      style={containerStyle}
    >
      <div className="px-6 pt-6 pb-5 border-b" style={headerStyle}>
        <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: theme.textSecondary }}>
          Studio Contact
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight" style={{ color: theme.textPrimary }}>
          We&apos;re listening
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          Share thoughts, ideas, or rough edges. We review every note from the studio and respond when we can.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="border rounded-2xl p-4 shadow-sm" style={cardStyle}>
          <label
            htmlFor="message"
            className="block text-xs font-semibold uppercase tracking-[0.28em] mb-2"
            style={{ color: theme.textSecondary }}
          >
            Your note
          </label>
          <textarea
            id="message"
            ref={textareaRef}
            placeholder="Let us know what feels helpful, confusing, or still missing."
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl px-4 py-3 resize-none border focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
            style={textareaStyle}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border px-4 py-3" style={toggleContainerStyle}>
          <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>Send anonymously</span>
          <button
            type="button"
            onClick={() => setSendAnonymously((prev) => !prev)}
            aria-pressed={sendAnonymously}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
            style={{
              backgroundColor: sendAnonymously 
                ? (darkMode ? "rgba(6, 182, 212, 0.7)" : "#0ea5e9")
                : (darkMode ? theme.elevated : "#e2e8f0"),
            }}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
              style={{
                transform: sendAnonymously ? "translateX(24px)" : "translateX(4px)",
              }}
            />
          </button>
        </div>
      </div>

      <div className="px-6 py-5 border-t flex items-center justify-between gap-4" style={footerStyle}>
        <p className="text-xs leading-relaxed max-w-[65%]" style={{ color: theme.textMuted }}>
          Your email stays private. We only reach out if you leave us a way to reply.
        </p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-full font-semibold text-sm transition-transform duration-200 shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            background: darkMode 
              ? "linear-gradient(to right, #06b6d4, #0ea5e9)"
              : "linear-gradient(to right, #0ea5e9, #06b6d4)",
            color: darkMode ? "#1e293b" : "#ffffff",
            opacity: isSubmitting ? 0.75 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            "Send feedback"
          )}
        </button>
      </div>
    </div>
  );
}
