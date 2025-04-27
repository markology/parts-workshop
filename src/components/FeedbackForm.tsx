import { useSendFeedback } from "@/hooks/useSendFeedback";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function FeedbackPopup() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const { data: session } = useSession();

  const { mutate: sendFeedback } = useSendFeedback();

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Feedback message cannot be empty");
      return;
    }

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
        },
        onError: () => {
          toast.error("Failed to send feedback. Try again later.");
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
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
