// hooks/useSendFeedback.ts
import { useMutation } from "@tanstack/react-query";
import emailjs from "emailjs-com";

interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
}

interface FeedbackPayload {
  name?: string;
  message: string;
  userEmail?: string;
  userId?: string;
  browserName?: string;
  browserVersion?: string;
  deviceType?: string;
  userAgent?: string;
  screenResolution?: string;
  accountInfo?: string;
  attachments?: Attachment[];
}

export const useSendFeedback = () => {
  return useMutation({
    mutationFn: async ({
      name,
      message,
      userEmail,
      userId,
      browserName,
      browserVersion,
      deviceType,
      userAgent,
      screenResolution,
      accountInfo,
      attachments,
    }: FeedbackPayload) => {
      const debugInfo = [
        `Browser: ${browserName || 'Unknown'} ${browserVersion || ''}`,
        `Device: ${deviceType || 'Unknown'}`,
        `Screen: ${screenResolution || 'Unknown'}`,
        `User Agent: ${userAgent || 'Unknown'}`,
        `Account: ${accountInfo || 'Not provided'}`,
      ].join('\n');

      const attachmentInfo = attachments && attachments.length > 0
        ? `\n\n--- Attachments ---\n${attachments.map(a => `${a.name} (${a.type}, ${(a.size / 1024).toFixed(2)} KB)`).join('\n')}\n\nBase64 data included below.`
        : '';

      const fullMessage = `${message}${attachmentInfo}\n\n--- Debug Info ---\n${debugInfo}`;

      // Include attachment data in the email template
      const templateParams: any = {
        name: name || "anonymous",
        message: fullMessage,
        userEmail: userEmail || "anonymous@user.com",
        userId: userId || "unknown",
      };

      // Add attachments as base64 data URLs (EmailJS can handle these)
      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment, index) => {
          templateParams[`attachment_${index + 1}_name`] = attachment.name;
          templateParams[`attachment_${index + 1}_data`] = attachment.data;
          templateParams[`attachment_${index + 1}_type`] = attachment.type;
        });
        templateParams.attachment_count = attachments.length.toString();
      }

      const res = await emailjs.send(
        "service_p1w1eiy", // 👈 paste your values
        "template_sz9orwb",
        templateParams,
        "hWD-jVch6P8v3kTEk"
      );

      return res;
    },
  });
};
