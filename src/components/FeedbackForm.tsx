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

  return (
    <div className={`p-6 rounded-2xl shadow-xl w-[500px] ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
    }`}>
      <h2 className={`text-xl font-semibold mb-4 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        We&apos;d love your feedback
      </h2>

      <div className="space-y-4">
        <div>
          <textarea
            id="message"
            ref={textareaRef}
            placeholder="What's working? What's confusing? Suggestions welcome."
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>

        <div className="flex items-center">
          <input
            id="sendAnonymously"
            type="checkbox"
            checked={sendAnonymously}
            onChange={(e) => setSendAnonymously(e.target.checked)}
            className={`w-4 h-4 rounded focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-blue-500' 
                : 'bg-white border-gray-300 text-blue-600'
            }`}
          />
          <label htmlFor="sendAnonymously" className={`ml-2 text-sm ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Send anonymously
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:scale-105"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Feedback"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
