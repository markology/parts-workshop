import { useSendFeedback } from "@/features/workspace/hooks/useSendFeedback";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function FeedbackPopup() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const { mutate: sendFeedback } = useSendFeedback();

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Feedback message cannot be empty");
      return;
    }

    setIsSubmitting(true);
    sendFeedback(
      {
        name,
        message,
        userEmail: session?.user?.email || undefined,
        userId: session?.user?.id,
      },
      {
        onSuccess: () => {
          toast.success("Feedback sent. Thank you!");
          setMessage("");
          setName("");
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
    <div className="p-6 rounded-lg shadow-xl max-w-120 w-[60vw] bg-theme text-theme">
      <h2 className="text-xl font-semibold mb-4 text-theme">
        We&apos;d love your feedback
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Your name (optional)
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Your feedback
          </label>
          <textarea
            id="message"
            placeholder="What's working? What's confusing? Suggestions welcome."
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`w-full px-3 py-2 rounded-md border resize-none `}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
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
