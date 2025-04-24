import { useState } from "react";
import { useSendFeedback } from "@/hooks/useSendFeedback";
import { useSession } from "next-auth/react";
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
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">
        We&apos;d love your feedback
      </h2>

      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 border rounded p-2"
      />

      <textarea
        placeholder="What’s working? What’s confusing? Suggestions welcome."
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full mb-4 border rounded p-2 resize-none"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
