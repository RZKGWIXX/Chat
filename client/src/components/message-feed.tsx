import { MessageItem } from "@/components/message-item";
import type { Message } from "@shared/schema";

interface MessageFeedProps {
  messages: Message[];
}

export function MessageFeed({ messages }: MessageFeedProps) {
  if (messages.length === 0) {
    return (
      <div className="px-4 py-8">
        <div className="flex justify-center mb-6">
          <div className="bg-dark-secondary rounded-lg px-4 py-3 max-w-sm text-center">
            <p className="text-dark-text-secondary text-sm">Welcome to Corp.OS Channel</p>
            <p className="text-dark-text-muted text-xs mt-1">Official updates and announcements</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Welcome Message */}
      <div className="flex justify-center mb-6">
        <div className="bg-dark-secondary rounded-lg px-4 py-3 max-w-sm text-center">
          <p className="text-dark-text-secondary text-sm">Welcome to Corp.OS Channel</p>
          <p className="text-dark-text-muted text-xs mt-1">Official updates and announcements</p>
        </div>
      </div>

      {/* Messages */}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
