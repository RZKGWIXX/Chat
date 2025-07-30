import React from "react";
import { Pin, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import type { Message } from "@shared/schema";

interface PinnedBarProps {
  pinnedMessage: Message;
  onScrollToMessage: (messageId: string) => void;
}

export function PinnedBar({ pinnedMessage, onScrollToMessage }: PinnedBarProps) {
  const queryClient = useQueryClient();

  const unpinMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("POST", `/api/messages/${messageId}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    unpinMutation.mutate(pinnedMessage.id);
  };

  const handleClick = () => {
    onScrollToMessage(pinnedMessage.id);
  };

  const getTruncatedContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-yellow-600/10 border-b border-yellow-600/20 px-3 sm:px-4 py-2">
      <div 
        className="flex items-center space-x-3 cursor-pointer hover:bg-yellow-600/5 rounded-lg p-2 transition-colors"
        onClick={handleClick}
      >
        <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-yellow-100 text-sm font-medium">Pinned Message</p>
          <p className="text-yellow-200/80 text-xs truncate">
            {pinnedMessage.content 
              ? getTruncatedContent(pinnedMessage.content)
              : pinnedMessage.messageType === "image" 
                ? "📷 Photo" 
                : pinnedMessage.messageType === "video"
                  ? "🎥 Video"
                  : "📎 File"
            }
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-yellow-600/20 text-yellow-200 hover:text-yellow-100"
          onClick={handleUnpin}
          disabled={unpinMutation.isPending}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}