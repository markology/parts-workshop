// hooks/useSendFeedback.ts
import { useMutation } from "@tanstack/react-query";
import emailjs from "emailjs-com";

interface FeedbackPayload {
  name?: string;
  message: string;
  userEmail?: string;
  userId?: string;
}

export const useSendFeedback = () => {
  return useMutation({
    mutationFn: async ({
      name,
      message,
      userEmail,
      userId,
    }: FeedbackPayload) => {
      console.log(message, userEmail, userId);
      const res = await emailjs.send(
        "service_p1w1eiy", // 👈 paste your values
        "template_sz9orwb",
        {
          name: name || "anonymous",
          message,
          userEmail: userEmail || "anonymous@user.com",
          userId: userId || "unknown",
        },
        "hWD-jVch6P8v3kTEk"
      );

      return res;
    },
  });
};
