import { useSendFeedback } from "@/features/workspace/hooks/useSendFeedback";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { Loader2, X, Image as ImageIcon, Video, Paperclip, Plus } from "lucide-react";

// Helper function to detect browser info
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.indexOf('Edg') > -1) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  }

  return { browserName, browserVersion, userAgent: ua };
};

// Helper function to detect device type
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'Tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
};

interface AttachedFile {
  file: File;
  preview?: string;
  id: string;
}

export default function FeedbackPopup() {
  const [message, setMessage] = useState("");
  const [sendAnonymously, setSendAnonymously] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const { data: session } = useSession();
  const { darkMode } = useThemeContext();
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: sendFeedback } = useSendFeedback();

  // Autofocus message input when form opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: AttachedFile[] = files.map(file => {
      const id = `${Date.now()}-${Math.random()}`;
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error('Please select only images or videos');
        return null;
      }

      const attachedFile: AttachedFile = { file, id };
      
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles(prev => 
            prev.map(f => f.id === id ? { ...f, preview: e.target?.result as string } : f)
          );
        };
        reader.readAsDataURL(file);
      }
      
      return attachedFile;
    }).filter((f): f is AttachedFile => f !== null);

    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attached file
  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Feedback message cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert files to base64
      const fileAttachments = await Promise.all(
        attachedFiles.map(async (attached) => ({
          name: attached.file.name,
          type: attached.file.type,
          size: attached.file.size,
          data: await fileToBase64(attached.file),
        }))
      );

      // Collect browser and device info
      const { browserName, browserVersion, userAgent } = getBrowserInfo();
      const deviceType = getDeviceType();
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      
      // Collect account info
      const accountInfo = sendAnonymously 
        ? 'Sent anonymously' 
        : JSON.stringify({
            name: session?.user?.name || 'Not provided',
            email: session?.user?.email || 'Not provided',
            userId: session?.user?.id || 'Not provided',
            image: session?.user?.image ? 'Has profile image' : 'No profile image',
          }, null, 2);

      // Add attachment info to message
      const attachmentInfo = fileAttachments.length > 0
        ? `\n\n--- Attachments (${fileAttachments.length}) ---\n${fileAttachments.map(f => `${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n')}`
        : '';

      sendFeedback(
        {
          name: sendAnonymously ? "" : (session?.user?.name || ""),
          message: message + attachmentInfo,
          userEmail: sendAnonymously ? undefined : (session?.user?.email || undefined),
          userId: sendAnonymously ? undefined : session?.user?.id,
          browserName,
          browserVersion,
          deviceType,
          userAgent,
          screenResolution,
          accountInfo,
          attachments: fileAttachments,
        },
        {
          onSuccess: () => {
            toast.success("Feedback sent. Thank you!");
            setMessage("");
            setSendAnonymously(false);
            setAttachedFiles([]);
            setIsSubmitting(false);
          },
          onError: () => {
            toast.error("Failed to send feedback. Try again later.");
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      toast.error("Failed to process attachments. Try again.");
      setIsSubmitting(false);
    }
  };

  const containerStyle = {
    backgroundColor: darkMode ? theme.modal : 'white',
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  const headerStyle = {
    background: darkMode ? theme.elevated : 'linear-gradient(to bottom, rgba(254, 241, 242, 0.3) 0%, #ffffff 100%)',
    borderColor: theme.border,
  };

  const cardStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  };

  const textareaStyle = {
    backgroundColor: darkMode ? theme.surface : '#f8fafc',
    borderColor: darkMode ? theme.border : '#e2e8f0',
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
      className="overflow-hidden w-full max-w-[520px] max-h-[90vh] rounded-[28px] border shadow-[0_22px_48px_rgba(15,23,42,0.18)] flex flex-col"
      style={containerStyle}
    >
      <div className="px-6 pt-6 pb-5 border-b" style={headerStyle}>
        <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: darkMode ? theme.textSecondary : '#0ea5e9' }}>
          Studio Contact
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight" style={{ color: theme.textPrimary }}>
          We&apos;re listening
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          Share thoughts, ideas, or rough edges. We review every note from the studio and respond when we can.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 min-h-0">
        <div 
          className="rounded-2xl p-4 mb-1.5" 
          style={{
            background: 'white',
            border: 'none',
            boxShadow: 'none',
            marginBottom: '6px',
          }}
        >
          <label
            htmlFor="message"
            className="block text-xs font-semibold uppercase tracking-[0.28em] mb-2"
            style={{ color: darkMode ? theme.textSecondary : '#0ea5e9', fontWeight: 500 }}
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
            className="w-full rounded-xl px-4 py-3 resize-none border focus:outline-none transition-shadow shadow-inner"
            style={textareaStyle}
          />
          
          {/* File attachments */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-attachment"
          />
          
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachedFiles.map((attached) => (
                <div
                  key={attached.id}
                  className="flex items-center gap-3 p-2 rounded-lg border"
                  style={{
                    backgroundColor: darkMode ? theme.surface : '#f8fafc',
                    borderColor: darkMode ? theme.border : '#e2e8f0',
                  }}
                >
                  {attached.file.type.startsWith('image/') && attached.preview ? (
                    <img
                      src={attached.preview}
                      alt={attached.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded bg-gray-100">
                      <Video className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: theme.textPrimary }}>
                      {attached.file.name}
                    </p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {(attached.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(attached.id)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    style={{ color: theme.textSecondary }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              color: darkMode ? theme.textSecondary : '#64748b',
              backgroundColor: darkMode ? theme.surface : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? theme.elevated : '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? theme.surface : 'transparent';
            }}
          >
            {attachedFiles.length > 0 ? (
              <>
                <Plus className="w-4 h-4" />
                Add more
              </>
            ) : (
              <>
                <Paperclip className="w-4 h-4" />
                Attach images or videos
              </>
            )}
          </button>
        </div>

        <div 
          className="flex items-center justify-between rounded-2xl px-4 py-3 shadow-sm" 
          style={darkMode ? toggleContainerStyle : {
            background: '#f7ebf352',
            border: 'none',
            borderBottom: 'solid 1px #dcdcdc1c',
          }}
        >
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

      <div 
        className="px-6 py-5 border-t flex items-center justify-between gap-4" 
        style={darkMode ? footerStyle : {
          background: 'linear-gradient(to bottom, #ffffff 0%, rgba(254, 241, 242, 0.3) 100%)',
          borderColor: theme.border,
        }}
      >
        <p className="text-xs leading-relaxed max-w-[65%]" style={{ color: theme.textMuted }}>
          Your email stays private. We only reach out if you leave us a way to reply.
        </p>
        <div className="flex items-center justify-end">
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
    </div>
  );
}
