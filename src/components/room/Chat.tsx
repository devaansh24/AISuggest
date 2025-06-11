"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Send, MessageCircle, X, Minimize2, Sparkles, Users, Zap } from "lucide-react";

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

interface NotificationPopup {
  id: string;
  message: string;
  userName: string;
  color: string;
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
  const [notifications, setNotifications] = useState<NotificationPopup[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const showNotificationPopup = useCallback((message: Message) => {
    if (message.user_id === myUserId) return;
    
    const notification: NotificationPopup = {
      id: `${message.id}-${Date.now()}`,
      message: message.message,
      userName: message.user_name,
      color: message.color,
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 4000);
  }, [myUserId]);

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
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    const channel = supabase
      .channel(`messages_${sessionId}_${Math.random()}`)
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
                if (prev.find(msg => msg.id === newMsg.id)) {
                  return prev;
                }
                const updated = [...prev, newMsg];
                setTimeout(scrollToBottom, 100);
                return updated;
              });
              
              // Show notification popup for other users' messages
              if (newMsg.user_id !== myUserId) {
                showNotificationPopup(newMsg);
                
                // Always increment unread count for other users' messages when chat is closed or minimized
                if (!isOpen || isMinimized) {
                  setUnreadCount((prev) => prev + 1);
                }
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
  }, [sessionId, myUserId, isOpen, isMinimized, scrollToBottom, showNotificationPopup]);

  useEffect(() => {
    if (!sessionId || !myUserId) return;
    
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    
    return () => {
      unsubscribe();
    };
  }, [sessionId, myUserId, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(scrollToBottom, 200);
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage("");
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
      
      if (data) {
        setMessages((prev) => {
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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {/* Notification Popups */}
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
            style={{ top: `${80 + index * 100}px` }}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div 
                className="h-1 bg-gradient-to-r from-blue-500 to-purple-600"
                style={{ backgroundColor: notification.color }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: notification.color }}
                      />
                      <span className="font-semibold text-gray-800 text-sm">
                        {notification.userName}
                      </span>
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {notification.message.length > 60 
                        ? `${notification.message.substring(0, 60)}...` 
                        : notification.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <motion.div className="fixed bottom-20 right-4 lg:bottom-8 lg:right-20 z-20">
        <motion.button
          className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white p-4 rounded-full shadow-2xl border border-white/20 transition-all duration-300"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleChat}
          animate={{
            boxShadow: unreadCount > 0 
              ? ["0 0 0 0 rgba(59, 130, 246, 0.7)", "0 0 0 20px rgba(59, 130, 246, 0)"]
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: unreadCount > 0 ? Infinity : 0,
              ease: "easeOut"
            }
          }}
        >
          {/* Floating particles effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                animate={{
                  x: [0, 10, -10, 0],
                  y: [0, -10, 10, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${30 + i * 15}%`,
                }}
              />
            ))}
          </div>
          
          <MessageCircle className="w-6 h-6 relative z-10" />
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg ring-2 ring-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.div>
          )}
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              duration: 0.2
            }}
            className="fixed bottom-36 right-4 lg:bottom-24 lg:right-20 w-80 lg:w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl z-30 border border-white/20 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white p-4 relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    animate={{
                      x: [0, 50, -50, 0],
                      y: [0, -30, 30, 0],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.7,
                      ease: "easeInOut"
                    }}
                    style={{
                      left: `${i * 20}%`,
                      top: `${20}%`,
                    }}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MessageCircle className="w-6 h-6" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <span className="font-bold text-lg">Team Chat</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Live
                      </span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {messages.length > 0 ? new Set(messages.map(m => m.user_id)).size : 1}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={toggleMinimize}
                    className="hover:bg-white/20 p-2 rounded-xl transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={toggleChat}
                    className="hover:bg-white/20 p-2 rounded-xl transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    duration: 0.15
                  }}
                  className="overflow-hidden"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-red-100 to-pink-100 border-l-4 border-red-500 text-red-700 px-4 py-3 text-sm"
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

                  {/* Messages Area */}
                  <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 via-blue-50 to-purple-50">
                    {isLoading && messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8">
                        <motion.div
                          className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="mt-4">Loading magical conversations...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8">
                        <motion.div
                          className="text-6xl mb-4"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          💬
                        </motion.div>
                        <p className="text-lg font-semibold text-gray-700">Ready to spark some ideas?</p>
                        <p className="text-xs mt-2 text-gray-500">Your team conversation starts here!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            delay: index * 0.05,
                            type: "spring",
                            stiffness: 200,
                            damping: 20
                          }}
                          className={`flex ${
                            message.user_id === myUserId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg relative ${
                              message.user_id === myUserId
                                ? "text-white rounded-br-md"
                                : "rounded-bl-md text-gray-800 bg-white/80 backdrop-blur-sm border border-white/50"
                            }`}
                            style={{
                              background: message.user_id === myUserId
                                ? `linear-gradient(135deg, ${myColor}dd, ${myColor})`
                                : undefined,
                            }}
                          >
                            {/* Sparkle effect for messages */}
                            {message.user_id !== myUserId && (
                              <motion.div
                                className="absolute -top-1 -right-1"
                                animate={{ 
                                  rotate: [0, 180, 360],
                                  scale: [0.8, 1.2, 0.8]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                              </motion.div>
                            )}
                            
                            {message.user_id !== myUserId && (
                              <div
                                className="text-xs font-bold mb-2 opacity-90 flex items-center gap-1"
                                style={{ color: message.color }}
                              >
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: message.color }}
                                />
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

                  {/* Input Area */}
                  <form
                    onSubmit={sendMessage}
                    className="p-4 bg-gradient-to-r from-white via-blue-50 to-purple-50 border-t border-white/50"
                  >
                    <div className="flex gap-3">
                      <motion.input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Share your brilliant ideas..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm focus:bg-white shadow-sm text-black placeholder-gray-500"
                        maxLength={500}
                        disabled={isLoading}
                        whileFocus={{ scale: 1.02 }}
                      />
                      <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Button glow effect */}
                        <motion.div
                          className="absolute inset-0 bg-white/20 rounded-2xl"
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0, 0.5, 0]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        {isLoading ? (
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <Send className="w-4 h-4 relative z-10" />
                        )}
                      </motion.button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {newMessage.length}/500
                      </span>
                      <span className="text-purple-600">Press Enter to send ✨</span>
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