import { Eye, Play } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const queryClient = useQueryClient();

  const incrementViewMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("POST", `/api/messages/${messageId}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const handleView = () => {
    incrementViewMutation.mutate(message.id);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatViews = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="flex justify-end mb-3 sm:mb-4">
      <div className="bg-telegram-blue rounded-2xl rounded-br-md overflow-hidden max-w-[85%] sm:max-w-lg shadow-lg">
        {/* Media Content */}
        {message.messageType === "image" && message.mediaUrl && (
          <img
            src={message.mediaUrl}
            alt="Shared image"
            className="w-full h-32 sm:h-48 object-cover cursor-pointer"
            onClick={handleView}
          />
        )}

        {message.messageType === "video" && message.mediaUrl && (
          <div className="relative">
            <video
              src={message.mediaUrl}
              className="w-full h-32 sm:h-48 object-cover"
              poster={message.mediaUrl}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button 
                className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                onClick={handleView}
              >
                <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <p className="text-white mb-1 sm:mb-2 text-sm sm:text-base break-words">{message.content}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">{formatTime(message.createdAt)}</span>
              <div className="flex items-center space-x-1 text-white/70">
                <Eye className="w-3 h-3" />
                <span>{formatViews(message.viewCount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Message without text content (media only) */}
        {!message.content && (message.messageType === "image" || message.messageType === "video") && (
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">{formatTime(message.createdAt)}</span>
              <div className="flex items-center space-x-1 text-white/70">
                <Eye className="w-3 h-3" />
                <span>{formatViews(message.viewCount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
