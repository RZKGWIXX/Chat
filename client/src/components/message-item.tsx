import React from "react";
import { Eye, Play, Pin, Heart, Trash2, Copy, FileText, Download, Reply, Share, Languages, Edit } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showContextMenu, setShowContextMenu] = React.useState(false);
  const [showEmojiBar, setShowEmojiBar] = React.useState(false);
  const [contextMenuPosition, setContextMenuPosition] = React.useState({ x: 0, y: 0 });
  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);
  
  // Generate a simple user ID for this session
  const userId = React.useMemo(() => {
    let id = localStorage.getItem('user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', id);
    }
    return id;
  }, []);

  // Available emoji reactions
  const emojiReactions = ['❤️', '👍', '👎', '🔥', '😍', '👏', '😂'];

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
    setShowContextMenu(false);
  };

  const handleReaction = () => {
    addReactionMutation.mutate(message.id);
  };

  const handleDelete = () => {
    deleteMutation.mutate(message.id);
    setShowContextMenu(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied to clipboard",
      description: "Message text copied successfully",
    });
    setShowContextMenu(false);
  };

  // Long press handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowContextMenu(true);
      setShowEmojiBar(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Only left mouse button
      const timer = setTimeout(() => {
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
        setShowEmojiBar(true);
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleEmojiReaction = (emoji: string) => {
    addReactionMutation.mutate(message.id);
    setShowContextMenu(false);
    setShowEmojiBar(false);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
    setShowEmojiBar(false);
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

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <>
      <div className="flex justify-end mb-3 sm:mb-4 group relative">
        <div 
          className={`rounded-2xl rounded-br-md overflow-hidden max-w-[85%] sm:max-w-lg shadow-lg relative select-none ${
            message.isPinned ? 'bg-yellow-600' : 'bg-telegram-blue'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
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

          {/* Text Content */}
          {message.content && (
            <div className="px-3 sm:px-4 py-2 sm:py-3">
              <p className="text-white text-sm sm:text-base break-words leading-relaxed">
                {message.content}
              </p>
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
                      <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                      <span>{message.reactionCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message with text content */}
          {message.content && (
            <div className="px-3 sm:px-4 pb-2 sm:pb-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-white/70">
                  <span>{formatTime(message.createdAt)}</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatViews(message.viewCount)}</span>
                  </div>
                  {message.reactionCount > 0 && (
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                      <span>{message.reactionCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emoji reaction bar */}
      {showEmojiBar && (
        <div 
          className="fixed z-50 bg-dark-secondary rounded-full px-3 py-2 shadow-lg border border-dark-tertiary"
          style={{
            left: Math.min(contextMenuPosition.x, window.innerWidth - 300),
            top: Math.max(contextMenuPosition.y - 60, 10),
          }}
        >
          <div className="flex items-center space-x-2">
            {emojiReactions.map((emoji, index) => (
              <button
                key={index}
                className="text-2xl hover:scale-110 transition-transform p-1 rounded-full hover:bg-white/10"
                onClick={() => handleEmojiReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button
              className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              onClick={closeContextMenu}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Context menu */}
      {showContextMenu && (
        <div 
          className="fixed z-40 bg-dark-secondary rounded-lg shadow-lg border border-dark-tertiary py-2 min-w-[200px]"
          style={{
            left: Math.min(contextMenuPosition.x, window.innerWidth - 220),
            top: Math.min(contextMenuPosition.y + 20, window.innerHeight - 300),
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={handleCopy}
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={closeContextMenu}
          >
            <Share className="w-4 h-4" />
            <span>Copy Link</span>
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={closeContextMenu}
          >
            <Share className="w-4 h-4" />
            <span>Forward</span>
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={handlePin}
          >
            <Pin className="w-4 h-4" />
            <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={closeContextMenu}
          >
            <Languages className="w-4 h-4" />
            <span>Translate</span>
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={closeContextMenu}
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          
          <div className="border-t border-dark-tertiary my-1" />
          
          <button
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-dark-tertiary transition-colors flex items-center space-x-3"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </>
  );
}