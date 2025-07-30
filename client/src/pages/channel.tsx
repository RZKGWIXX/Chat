import { useQuery } from "@tanstack/react-query";
import { Search, Info } from "lucide-react";
import { MessageFeed } from "@/components/message-feed";
import { AdminComposer } from "@/components/admin-composer";
import type { Message } from "@shared/schema";

export default function Channel() {
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-dark-tertiary px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-telegram-blue rounded-full flex items-center justify-center font-bold text-lg text-white">
            C
          </div>
          <div>
            <h1 className="text-lg font-semibold text-dark-text">Corp.OS Channel</h1>
            <p className="text-sm text-dark-text-secondary">
              {messages.length} messages
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-dark-tertiary rounded-lg transition-colors">
            <Search className="w-5 h-5 text-dark-text-secondary" />
          </button>
          <button className="p-2 hover:bg-dark-tertiary rounded-lg transition-colors">
            <Info className="w-5 h-5 text-dark-text-secondary" />
          </button>
        </div>
      </header>

      {/* Message Feed */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-dark-text-secondary">Loading messages...</div>
          </div>
        ) : (
          <MessageFeed messages={messages} />
        )}
      </main>

      {/* Admin Composer */}
      <AdminComposer />
    </div>
  );
}
