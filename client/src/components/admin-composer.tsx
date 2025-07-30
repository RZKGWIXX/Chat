import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Image, Video, Smile, Send, X, Settings, FileText, Paperclip } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function AdminComposer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const postMessageMutation = useMutation({
    mutationFn: async (data: { content: string; file?: File; messageType?: string }) => {
      if (data.file) {
        const formData = new FormData();
        formData.append("content", data.content);
        formData.append("file", data.file);
        formData.append("messageType", data.messageType || "text");
        
        const response = await fetch("/api/messages/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload message");
        }
        
        return response.json();
      } else {
        return apiRequest("POST", "/api/messages", {
          content: data.content,
          messageType: "text",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsExpanded(false);
      toast({
        title: "Message posted successfully",
        description: "Your message has been published to the channel.",
      });
    },
    onError: () => {
      toast({
        title: "Error posting message",
        description: "There was an error posting your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File, type: "image" | "video") => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleVideoUpload = () => {
    videoInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, "image");
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, "video");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // No preview URL for regular files
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handlePost = () => {
    if (!messageText.trim() && !selectedFile) {
      toast({
        title: "Empty message",
        description: "Please enter a message or select a file to post.",
        variant: "destructive",
      });
      return;
    }

    let messageType = "text";
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        messageType = "image";
      } else if (selectedFile.type.startsWith("video/")) {
        messageType = "video";
      } else {
        messageType = "file";
      }
    }

    postMessageMutation.mutate({
      content: messageText,
      file: selectedFile || undefined,
      messageType,
    });
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setMessageText("");
    removeFile();
  };

  return (
    <div className="bg-dark-secondary border-t border-dark-tertiary p-3 sm:p-4 sticky bottom-0">
      {/* Collapsed State */}
      {!isExpanded && (
        <div className="mb-3 sm:mb-4">
          <button
            className="w-full bg-dark-tertiary hover:bg-dark-tertiary/80 transition-colors rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-left text-dark-text-secondary flex items-center justify-between text-sm sm:text-base"
            onClick={() => setIsExpanded(true)}
          >
            <span>📝 Post new message...</span>
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-telegram-blue" />
          </button>
        </div>
      )}

      {/* Expanded Composer */}
      {isExpanded && (
        <div>
          {/* File Preview */}
          {selectedFile && (
            <div className="mb-3 sm:mb-4 bg-dark-tertiary rounded-lg p-2 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-dark-text-secondary">
                  {selectedFile.type.startsWith("image/") ? "📷 Image attached" : 
                   selectedFile.type.startsWith("video/") ? "🎥 Video attached" :
                   "📎 File attached"}
                </span>
                <button
                  className="text-red-400 hover:text-red-300 transition-colors"
                  onClick={removeFile}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              
              {previewUrl ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-dark-bg rounded border-2 border-dashed border-dark-text-muted overflow-hidden">
                  {selectedFile.type.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-dark-bg rounded p-2">
                  <FileText className="w-4 h-4 text-telegram-blue" />
                  <span className="text-xs text-dark-text truncate">{selectedFile.name}</span>
                  <span className="text-xs text-dark-text-muted">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Message Input */}
          <div className="relative mb-3 sm:mb-4">
            <Textarea
              className="w-full bg-dark-tertiary border border-dark-tertiary focus:border-telegram-blue rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-dark-text placeholder-dark-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-telegram-blue/20 transition-all text-sm sm:text-base"
              rows={3}
              placeholder="Write your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <div className="absolute bottom-1 sm:bottom-2 right-2 text-xs text-dark-text-muted">
              {messageText.length}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                className="bg-dark-tertiary hover:bg-dark-tertiary/80 text-dark-text-secondary text-xs sm:text-sm flex-shrink-0"
                onClick={handleImageUpload}
              >
                <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-telegram-blue" />
                <span className="hidden sm:inline">Photo</span>
                <span className="sm:hidden">📷</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="bg-dark-tertiary hover:bg-dark-tertiary/80 text-dark-text-secondary text-xs sm:text-sm flex-shrink-0"
                onClick={handleVideoUpload}
              >
                <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-telegram-blue" />
                <span className="hidden sm:inline">Video</span>
                <span className="sm:hidden">🎥</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="bg-dark-tertiary hover:bg-dark-tertiary/80 text-dark-text-secondary text-xs sm:text-sm flex-shrink-0"
                onClick={handleFileUpload}
              >
                <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-telegram-blue" />
                <span className="hidden sm:inline">File</span>
                <span className="sm:hidden">📎</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="bg-dark-tertiary hover:bg-dark-tertiary/80 text-dark-text-secondary text-xs sm:text-sm flex-shrink-0"
              >
                <Smile className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-telegram-blue" />
                <span className="hidden sm:inline">Emoji</span>
                <span className="sm:hidden">😊</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2 justify-end">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-dark-text-secondary hover:text-dark-text text-xs sm:text-sm"
                size="sm"
              >
                Cancel
              </Button>

              <Button
                className="bg-telegram-blue hover:bg-telegram-blue/90 text-white text-xs sm:text-sm"
                onClick={handlePost}
                disabled={postMessageMutation.isPending}
                size="sm"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {postMessageMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Controls */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-dark-tertiary">
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-dark-text-secondary">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></div>
          <span>Admin Mode</span>
        </div>
        <button className="text-xs sm:text-sm text-telegram-blue hover:text-telegram-blue/80 transition-colors flex items-center space-x-1">
          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
