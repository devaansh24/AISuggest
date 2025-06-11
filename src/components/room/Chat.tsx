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
const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      if (data) {
        setMessages(data);
        // Scroll to bottom after loading messages
        setTimeout(scrollToBottom, 100);
      }
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  setError(`Failed to load messages: ${errorMessage}`);

    } finally {
      setIsLoading(false);
    }
  }, [sessionId, scrollToBottom]);

  const subscribeToMessages = useCallback(() => {
    if (!sessionId) return () => {};
    
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    const channel = supabase
      .channel(`messages_${sessionId}_${Math.random()}`) // Add random suffix to avoid conflicts
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Message change received:", payload);
          
          try {
            if (payload.eventType === "INSERT") {
              const newMsg = payload.new as Message;
              console.log("New message:", newMsg);
              
              setMessages((prev) => {
                // Check if message already exists to prevent duplicates
                if (prev.find(msg => msg.id === newMsg.id)) {
                  return prev;
                }
                const updated = [...prev, newMsg];
                // Scroll to bottom for new messages
                setTimeout(scrollToBottom, 100);
                return updated;
              });
              
              // Update unread count if chat is closed or minimized and message is from another user
              if (newMsg.user_id !== myUserId && (!isOpen || isMinimized)) {
                setUnreadCount((prev) => prev + 1);
              }
            } else if (payload.eventType === "DELETE") {
              const deletedMsg = payload.old as Message;
              setMessages((prev) => prev.filter(msg => msg.id !== deletedMsg.id));
            }
          } catch (error) {
            console.error("Error handling message update:", error);
          }
        }
      )
      .subscribe((status) => {
        console.log("Message subscription status:", status);
      });

    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, myUserId, isOpen, isMinimized, scrollToBottom]);

  // Initialize chat
  useEffect(() => {
    if (!sessionId || !myUserId) return;
    
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    
    return () => {
      unsubscribe();
    };
  }, [sessionId, myUserId, fetchMessages, subscribeToMessages]);

  // Auto-scroll when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(scrollToBottom, 200);
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized, scrollToBottom]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: myUserId,
        user_name: myUserName,
        message: messageText,
        color: myColor,
      }).select().single();

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }
      
      // Optimistically add message to local state to avoid waiting for subscription
      if (data) {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          if (prev.find(msg => msg.id === data.id)) {
            return prev;
          }
          const updated = [...prev, data];
          setTimeout(scrollToBottom, 100);
          return updated;
        });
      }
      
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  setError(`Failed to send message: ${errorMessage}`);
  // Restore message text if sending failed
  setNewMessage(messageText);
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
      // Focus input when opening chat
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
      // Focus input when unminimizing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  return (
    <>
      <motion.button
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-20 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl z-20 border border-white/20 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-36 right-4 lg:bottom-24 lg:right-20 w-80 lg:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl z-30 border border-white/20 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Team Chat</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={toggleMinimize}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minimize2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={toggleChat}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span>{error}</span>
                        <button
                          onClick={() => setError(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                    {isLoading && messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8">
                        <motion.div
                          className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8">
                        <div className="text-4xl mb-2">💬</div>
                        <p>No messages yet.</p>
                        <p className="text-xs mt-1">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex ${
                            message.user_id === myUserId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                              message.user_id === myUserId
                                ? "text-white rounded-br-md"
                                : "rounded-bl-md text-gray-800 bg-white border"
                            }`}
                            style={{
                              backgroundColor:
                                message.user_id === myUserId
                                  ? myColor
                                  : undefined,
                            }}
                          >
                            {message.user_id !== myUserId && (
                              <div
                                className="text-xs font-bold mb-1 opacity-80"
                                style={{ color: message.color }}
                              >
                                {message.user_name}
                              </div>
                            )}
                            <div className="text-sm break-words leading-relaxed">
                              {message.message}
                            </div>
                            <div
                              className={`text-xs mt-2 opacity-70 ${
                                message.user_id === myUserId
                                  ? "text-white"
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
                    className="p-4 border-t border-gray-200 bg-white"
                  >
                    <div className="flex gap-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        maxLength={500}
                        disabled={isLoading}
                      />
                      <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isLoading ? (
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex justify-between">
                      <span>{newMessage.length}/500</span>
                      <span>Press Enter to send</span>
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