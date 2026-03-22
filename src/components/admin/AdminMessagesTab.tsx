import { MessageCircle, Send, ArrowLeft, User, Search, Check, CheckCheck, RefreshCw } from "lucide-react";
import { notifyNewMessage } from "@/lib/notifications"; // now exported
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollAreaScrollbar, ScrollAreaViewport } from "@/components/ui/scroll-area";

export default function AdminMessagesTab() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [scrollToBottom, setScrollToBottom] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select(`
          *,
          participant_1:profiles!conversations_participant_1_fkey(*),
          participant_2:profiles!conversations_participant_2_fkey(*)
        `)
        .order("updated_at", { ascending: false });

      setConversations(data || []);
    };

    loadConversations();

    const channel = supabase
      .channel("admin-conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setScrollToBottom(true);
    };

    loadMessages();

    const channel = supabase
      .channel(`admin-messages-${selectedConversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConversation.id}` },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new]);
          // Mark as read for the recipient
          if (user && payload.new.sender_id !== user.id) {
            // Update the message as read in the database            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (messageError) throw messageError;

      setNewMessage("");
      setScrollToBottom(true);

      // Notify the recipient
      const recipientId =
        selectedConversation.participant_1.id === user.id
          ? selectedConversation.participant_2.id
          : selectedConversation.participant_1.id;
      const recipientName =
        selectedConversation.participant_1.id === user.id
          ? selectedConversation.participant_2.first_name +
            " " +
            selectedConversation.participant_2.last_name
          : selectedConversation.participant_1.first_name +
            " " +
            selectedConversation.participant_1.last_name;

      notifyNewMessage(recipientId, `${profile?.first_name} ${profile?.last_name}`, newMessage.trim());
    } catch (error: any) {
      console.error("Failed to send message:", error);
    }
  };

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation);
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="flex">
        {/* Conversations List */}
        <div className="w-64 border-r border-border">
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const recipient =
                conversation.participant_1.id === user.id
                  ? conversation.participant_2
                  : conversation.participant_1;
              const unreadCount = conversation.unread_count || 0;
              const lastMessage = conversation.last_message || "";

              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors ${
                    isSelected ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {recipient.first_name?.[0]}{recipient.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {recipient.first_name} {recipient.last_name}
                      </p>
                      {lastMessage && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {lastMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                      <CheckCheck className="h-4 w-4 text-primary/50" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {selectedConversation.participant_1.id === user.id
                        ? selectedConversation.participant_2.first_name?.[0] +
                          selectedConversation.participant_2.last_name?.[0]
                        : selectedConversation.participant_1.first_name?.[0] +
                          selectedConversation.participant_1.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground">
                        {selectedConversation.participant_1.id === user.id
                          ? selectedConversation.participant_2.first_name +
                            " " +
                            selectedConversation.participant_2.last_name
                          : selectedConversation.participant_1.first_name +
                            " " +
                            selectedConversation.participant_1.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Online • {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <ScrollAreaViewport className="flex-1 p-4 space-y-4" onScrollChange={({ scrolling }) => setScrollToBottom(!scrolling)}>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user.id ? "justify-end" : "justify-start"} space-y-1`}
                        >
                          <div className="bg-${message.sender_id === user.id ? "primary" : "muted"} text-${message.sender_id === user.id ? "primary-foreground" : "foreground"} rounded-lg px-3 py-2 max-w-[80%]">
                            {message.content}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                      {scrollToBottom && (
                        <div className="h-4 w-4" />
                      )}
                    </ScrollAreaViewport>
                    <ScrollAreaScrollbar className="w-2" />
                  </ScrollArea>

                  <div className="px-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg p-2"
                      />
                      <button                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="p-2"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}