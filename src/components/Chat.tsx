"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Send, MessageCircle, X, Minimize2 } from "lucide-react";

interface Message {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
  color: string;
}

interface ChatProps {
  sessionId: string;
  myUserId: string;
  myUserName: string;
  myColor: string;
}

export default function Chat({
  sessionId,
  myUserId,
  myUserName,
  myColor,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const subscribeToMessages = useCallback(() => {
    const channel = supabase
      .channel(`messages_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.user_id !== myUserId && (!isOpen || isMinimized)) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, myUserId, isOpen, isMinimized]);

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [fetchMessages, subscribeToMessages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: myUserId,
        user_name: myUserName,
        message: newMessage.trim(),
        color: myColor,
      });

      if (error) throw error;
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      <motion.button
        className="fixed bottom-8 left-8 bg-white/90 backdrop-blur-sm text-gray-700 p-4 rounded-full shadow-2xl z-20 border border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100, y: 100 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -100, y: 100 }}
            className="fixed bottom-24 left-8 w-80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl z-30 border border-white/20 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Chat</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMinimize}
                  className="hover:bg-white/20 p-1 rounded"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleChat}
                  className="hover:bg-white/20 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="h-80 overflow-y-auto p-4 space-y-3">
                    {isLoading && messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            message.user_id === myUserId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                              message.user_id === myUserId
                                ? "bg-blue-500 text-white rounded-br-sm"
                                : "rounded-bl-sm text-gray-800"
                            }`}
                            style={{
                              backgroundColor:
                                message.user_id === myUserId
                                  ? myColor
                                  : `${message.color}40`,
                            }}
                          >
                            {message.user_id !== myUserId && (
                              <div
                                className="text-xs font-semibold mb-1"
                                style={{ color: message.color }}
                              >
                                {message.user_name}
                              </div>
                            )}
                            <div className="text-sm break-words">
                              {message.message}
                            </div>
                            <div
                              className={`text-xs mt-1 ${
                                message.user_id === myUserId
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={sendMessage}
                    className="p-4 border-t border-gray-200"
                  >
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={500}
                        disabled={isLoading}
                      />
                      <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Send className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}