import React from "react";
import { Eye, Play, Pin, Heart, Trash2, MoreHorizontal, Copy, FileText, Download } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Message } from "@shared/schema";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Generate a simple user ID for this session
  const userId = React.useMemo(() => {
    let id = localStorage.getItem('user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', id);
    }
    return id;
  }, []);

  const incrementViewMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("POST", `/api/messages/${messageId}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("POST", `/api/messages/${messageId}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: message.isPinned ? "Message unpinned" : "Message pinned",
        description: message.isPinned ? "Message removed from pinned" : "Message pinned to top",
      });
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("POST", `/api/messages/${messageId}/reaction`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message deleted",
        description: "Message has been removed from the channel",
      });
    },
  });

  const handleView = () => {
    incrementViewMutation.mutate(message.id);
  };

  const handlePin = () => {
    togglePinMutation.mutate(message.id);
  };

  const handleReaction = () => {
    addReactionMutation.mutate(message.id);
  };

  const handleDelete = () => {
    deleteMutation.mutate(message.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied to clipboard",
      description: "Message text copied successfully",
    });
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
    <div className="flex justify-end mb-3 sm:mb-4 group">
      <div className={`rounded-2xl rounded-br-md overflow-hidden max-w-[85%] sm:max-w-lg shadow-lg relative ${
        message.isPinned ? 'bg-yellow-600' : 'bg-telegram-blue'
      }`}>
        {/* Pin indicator */}
        {message.isPinned && (
          <div className="absolute top-2 right-2 z-10 bg-black/20 rounded-full p-1">
            <Pin className="w-3 h-3 text-white" />
          </div>
        )}
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

        {message.messageType === "file" && message.mediaUrl && (
          <div className="p-3 sm:p-4">
            <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
              <FileText className="w-8 h-8 text-white/80 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {message.mediaFilename || "File"}
                </p>
                <p className="text-white/70 text-sm">Document file</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-white/10"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = message.mediaUrl!;
                  link.download = message.mediaFilename || 'file';
                  link.click();
                }}
              >
                <Download className="w-4 h-4 text-white/70" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <p className="text-white mb-1 sm:mb-2 text-sm sm:text-base break-words">{message.content}</p>
            
            {/* Message stats and actions */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-white/70">
                <span>{formatTime(message.createdAt)}</span>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatViews(message.viewCount)}</span>
                </div>
                {message.reactionCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span>{message.reactionCount}</span>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-white/10"
                  onClick={handleReaction}
                >
                  <Heart className="w-3 h-3 text-white/70 hover:text-red-400" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/10"
                    >
                      <MoreHorizontal className="w-3 h-3 text-white/70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-dark-secondary border-dark-tertiary">
                    <DropdownMenuItem onClick={handlePin} className="text-dark-text hover:bg-dark-tertiary">
                      <Pin className="w-4 h-4 mr-2" />
                      {message.isPinned ? 'Unpin' : 'Pin'} message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopy} className="text-dark-text hover:bg-dark-tertiary">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy text
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="text-red-400 hover:bg-dark-tertiary hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        {/* Message without text content (media only) */}
        {!message.content && (message.messageType === "image" || message.messageType === "video" || message.messageType === "file") && (
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-white/70">
                <span>{formatTime(message.createdAt)}</span>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatViews(message.viewCount)}</span>
                </div>
                {message.reactionCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span>{message.reactionCount}</span>
                  </div>
                )}
              </div>
              
              {/* Action buttons for media */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-white/10"
                  onClick={handleReaction}
                >
                  <Heart className="w-3 h-3 text-white/70 hover:text-red-400" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/10"
                    >
                      <MoreHorizontal className="w-3 h-3 text-white/70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-dark-secondary border-dark-tertiary">
                    <DropdownMenuItem onClick={handlePin} className="text-dark-text hover:bg-dark-tertiary">
                      <Pin className="w-4 h-4 mr-2" />
                      {message.isPinned ? 'Unpin' : 'Pin'} message
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="text-red-400 hover:bg-dark-tertiary hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
