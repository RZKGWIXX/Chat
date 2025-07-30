import React from "react";
import { MessageItem } from "@/components/message-item";
import type { Message } from "@shared/schema";

interface MessageFeedProps {
  messages: Message[];
  messageRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

export function MessageFeed({ messages, messageRefs }: MessageFeedProps) {
  if (messages.length === 0) {
    return (
      <div className="px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex justify-center mb-6">
          <div className="bg-dark-secondary rounded-lg px-3 sm:px-4 py-3 max-w-xs sm:max-w-sm text-center mx-2">
            <p className="text-dark-text-secondary text-sm">Welcome to Corp.OS Channel</p>
            <p className="text-dark-text-muted text-xs mt-1">Official updates and announcements</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
      {/* Welcome Message */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="bg-dark-secondary rounded-lg px-3 sm:px-4 py-3 max-w-xs sm:max-w-sm text-center mx-2">
          <p className="text-dark-text-secondary text-sm">Welcome to Corp.OS Channel</p>
          <p className="text-dark-text-muted text-xs mt-1">Official updates and announcements</p>
        </div>
      </div>

      {/* Messages */}
      {messages.map((message) => (
        <div 
          key={message.id}
          ref={(el) => {
            if (messageRefs) {
              messageRefs.current[message.id] = el;
            }
          }}
        >
          <MessageItem message={message} />
        </div>
      ))}
    </div>
  );
}
