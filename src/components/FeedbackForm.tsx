import { useSendFeedback } from "@/features/workspace/hooks/useSendFeedback";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useThemeContext } from "@/state/context/ThemeContext";
import { Loader2 } from "lucide-react";

export default function FeedbackPopup() {
  const [message, setMessage] = useState("");
  const [sendAnonymously, setSendAnonymously] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const { darkMode } = useThemeContext();
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

  const containerClasses = darkMode
    ? "bg-slate-950/95 border-slate-800 text-slate-100"
    : "bg-white border-sky-100 text-slate-900";

  const headerClasses = darkMode
    ? "bg-slate-950/80 border-slate-800"
    : "bg-gradient-to-br from-sky-50 via-cyan-50 to-white border-sky-100";

  const headerAccentClasses = darkMode ? "text-cyan-300/80" : "text-sky-600/80";
  const titleClasses = darkMode ? "text-white" : "text-slate-900";
  const subtitleClasses = darkMode ? "text-slate-300/80" : "text-slate-600";

  const cardClasses = darkMode
    ? "bg-slate-900/60 border-slate-800"
    : "bg-white border-sky-100";

  const labelClasses = darkMode ? "text-cyan-200/70" : "text-sky-600";
  const textareaClasses = darkMode
    ? "bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500"
    : "bg-white border-sky-200 text-slate-900 placeholder-slate-400";

  const toggleContainerClasses = darkMode
    ? "bg-slate-900/60 border-slate-800"
    : "bg-sky-50 border-sky-100";

  const toggleLabelClasses = darkMode ? "text-slate-200" : "text-slate-700";

  const toggleTrackClasses = sendAnonymously
    ? darkMode
      ? "bg-cyan-500/70"
      : "bg-sky-500"
    : darkMode
    ? "bg-slate-800"
    : "bg-slate-200";

  const footerClasses = darkMode
    ? "bg-slate-950/80 border-slate-800"
    : "bg-sky-50 border-sky-100";

  const footerTextClasses = darkMode ? "text-slate-400" : "text-slate-500";

  const buttonBaseClasses = "px-6 py-2 rounded-full font-semibold text-sm transition-transform duration-200 shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const buttonPaletteClasses = darkMode
    ? "bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-900 focus:ring-cyan-400 focus:ring-offset-slate-900"
    : "bg-gradient-to-r from-sky-500 to-cyan-500 text-white focus:ring-sky-300 focus:ring-offset-sky-50";

  return (
    <div
      className={`overflow-hidden w-full max-w-[520px] min-h-[520px] rounded-[28px] border shadow-[0_22px_48px_rgba(15,23,42,0.18)] flex flex-col ${containerClasses}`}
    >
      <div className={`px-6 pt-6 pb-5 border-b ${headerClasses}`}>
        <p className={`text-[11px] uppercase tracking-[0.32em] ${headerAccentClasses}`}>
          Studio Contact
        </p>
        <h2 className={`mt-2 text-2xl font-semibold leading-tight ${titleClasses}`}>
          We&apos;re listening
        </h2>
        <p className={`mt-3 text-sm leading-relaxed ${subtitleClasses}`}>
          Share thoughts, ideas, or rough edges. We review every note from the studio and respond when we can.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className={`border rounded-2xl p-4 shadow-sm ${cardClasses}`}>
          <label
            htmlFor="message"
            className={`block text-xs font-semibold uppercase tracking-[0.28em] mb-2 ${labelClasses}`}
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
            className={`w-full rounded-xl px-4 py-3 resize-none border focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow ${textareaClasses}`}
          />
        </div>

        <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${toggleContainerClasses}`}>
          <span className={`text-sm font-medium ${toggleLabelClasses}`}>Send anonymously</span>
          <button
            type="button"
            onClick={() => setSendAnonymously((prev) => !prev)}
            aria-pressed={sendAnonymously}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${toggleTrackClasses}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${sendAnonymously ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </div>

      <div className={`px-6 py-5 border-t flex items-center justify-between gap-4 ${footerClasses}`}>
        <p className={`text-xs leading-relaxed max-w-[65%] ${footerTextClasses}`}>
          Your email stays private. We only reach out if you leave us a way to reply.
        </p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`${buttonBaseClasses} ${isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:scale-105"} ${buttonPaletteClasses}`}
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
