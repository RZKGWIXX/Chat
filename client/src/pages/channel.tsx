import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Info, X } from "lucide-react";
import { MessageFeed } from "@/components/message-feed";
import { AdminComposer } from "@/components/admin-composer";
import { PinnedBar } from "@/components/pinned-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Message } from "@shared/schema";

export default function Channel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery<Message[]>({
    queryKey: ["/api/messages/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/messages/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery.trim(),
  });

  const displayMessages = searchQuery.trim() ? searchResults : messages;
  
  // Find pinned message
  const pinnedMessage = displayMessages.find(msg => msg.isPinned);
  
  // Sort messages chronologically (pinned messages are shown in the pinned bar)
  const sortedMessages = [...displayMessages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Function to scroll to a specific message
  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add highlight effect
      messageElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-dark-tertiary px-3 sm:px-4 py-3 sticky top-0 z-10">
        {!isSearchOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-telegram-blue rounded-full flex items-center justify-center font-bold text-sm sm:text-lg text-white flex-shrink-0">
                C
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-dark-text truncate">Corp.OS Channel</h1>
                <p className="text-xs sm:text-sm text-dark-text-secondary">
                  {searchQuery ? `${sortedMessages.length} found` : `${messages.length} messages`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-dark-tertiary rounded-lg transition-colors"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-dark-text-secondary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-dark-tertiary rounded-lg transition-colors"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-dark-text-secondary" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-dark-tertiary border-dark-tertiary text-dark-text placeholder-dark-text-muted focus:border-telegram-blue"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 sm:p-2 hover:bg-dark-tertiary rounded-lg transition-colors"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-dark-text-secondary" />
            </Button>
          </div>
        )}
      </header>

      {/* Pinned message bar */}
      {pinnedMessage && !searchQuery.trim() && (
        <PinnedBar 
          pinnedMessage={pinnedMessage} 
          onScrollToMessage={scrollToMessage} 
        />
      )}

      {/* Message Feed */}
      <main className="flex-1 overflow-y-auto">
        {isLoading || isSearching ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-dark-text-secondary">
              {isSearching ? "Searching..." : "Loading messages..."}
            </div>
          </div>
        ) : (
          <MessageFeed 
            messages={sortedMessages} 
            messageRefs={messageRefs}
          />
        )}
      </main>

      {/* Admin Composer */}
      <AdminComposer />
    </div>
  );
}
