"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Plus, Users, Copy, Share2, Check } from "lucide-react";
import LiveCursor from "@/components/LiveCursor";
import Chat from "@/components/Chat";
import { v4 as uuidv4 } from "uuid";

type RoomPageProps = {
  params: Promise<{
    id: string;
  }>;
};

interface Idea {
  id: string;
  session_id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  created_at: string;
}

interface Participant {
  user_id: string;
  user_name: string;
  cursor_x: number;
  cursor_y: number;
  color: string;
  last_seen: string;
  hovering_idea_id?: string | null;
}

interface Session {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [otherParticipants, setOtherParticipants] = useState<Participant[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentHoveringIdeaId, setCurrentHoveringIdeaId] = useState<string | null>(null);
  
  // User info state
  const [myUserId, setMyUserId] = useState<string>("");
  const [myUserName, setMyUserName] = useState<string>("");
  const [myColor, setMyColor] = useState<string>("");
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const participantCleanupRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication and set user info
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (!user) {
          router.push("/");
          return;
        }
        
        setUser(user);
        setMyUserId(user.id);
        setMyUserName(user.email?.split("@")[0] || "Anonymous");
        
        // Set a consistent color for the authenticated user
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
        const userColorIndex = user.id.charCodeAt(0) % colors.length;
        setMyColor(colors[userColorIndex]);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error checking user:", err);
        router.push("/");
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Resolve params Promise and check if session exists
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const roomId = resolvedParams.id;
      setSessionId(roomId);
      
      // Check if session exists
      try {
        const { data: sessionData, error } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", roomId)
          .single();
          
        if (error || !sessionData) {
          setRoomNotFound(true);
          return;
        }
        
        setSession(sessionData);
      } catch (error) {
        console.error("Error checking session:", error);
        setRoomNotFound(true);
      }
    };
    
    resolveParams();
  }, [params]);

  // Copy room ID to clipboard
  const copyRoomId = async () => {
    if (!sessionId) return;
    
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Join/leave session
  const joinSession = useCallback(async () => {
    if (!sessionId || !myUserId) return;
    
    try {
      const { error } = await supabase
        .from("participants")
        .upsert(
          {
            session_id: sessionId,
            user_id: myUserId,
            user_name: myUserName,
            color: myColor,
            cursor_x: 0,
            cursor_y: 0,
            last_seen: new Date().toISOString(),
            hovering_idea_id: null,
          },
          { onConflict: "session_id,user_id" }
        );

      if (error) throw error;
    } catch (error) {
      console.error("Error joining session:", error);
    }
  }, [sessionId, myUserId, myUserName, myColor]);

  const leaveSession = useCallback(async () => {
    if (!sessionId || !myUserId) return;
    
    try {
      await supabase
        .from("participants")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", myUserId);
    } catch (error) {
      console.error("Error leaving session:", error);
    }
  }, [sessionId, myUserId]);

  // Cursor position updates with throttling
  const updateCursorPosition = useCallback(async (x: number, y: number, hoveringIdeaId: string | null = null) => {
    if (!sessionId || !myUserId) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      try {
        await supabase.from("participants").upsert({
          session_id: sessionId,
          user_id: myUserId,
          user_name: myUserName,
          color: myColor,
          cursor_x: x,
          cursor_y: y,
          last_seen: new Date().toISOString(),
          hovering_idea_id: hoveringIdeaId,
        });
      } catch (error) {
        console.error("Error updating cursor position:", error);
      }
    }, 50);
  }, [sessionId, myUserId, myUserName, myColor]);

  // Clean up old participants periodically
  const cleanupOldParticipants = useCallback(() => {
    if (!sessionId) return;
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    setOtherParticipants(prev => 
      prev.filter(p => new Date(p.last_seen) > fiveMinutesAgo)
    );
  }, [sessionId]);

  // Subscribe to cursor movements
  const subscribeToCursors = useCallback(() => {
    if (!sessionId || !myUserId) return () => {};
    
    const channel = supabase
      .channel(`participants_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          try {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const participant = payload.new as Participant;
              if (participant.user_id !== myUserId) {
                setOtherParticipants((prev) => {
                  const existing = prev.find(p => p.user_id === participant.user_id);
                  if (existing) {
                    return prev.map(p => 
                      p.user_id === participant.user_id ? participant : p
                    );
                  }
                  return [...prev, participant];
                });
              }
            } else if (payload.eventType === "DELETE") {
              const participant = payload.old as Participant;
              setOtherParticipants((prev) =>
                prev.filter((p) => p.user_id !== participant.user_id)
              );
            }
          } catch (error) {
            console.error("Error handling cursor update:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, myUserId]);

  // Fetch and subscribe to ideas
  const fetchIdeas = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setIdeas(data);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    }
  }, [sessionId]);

  const subscribeToIdeas = useCallback(() => {
    if (!sessionId) return () => {};
    
    const channel = supabase
      .channel(`ideas_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideas",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          try {
            if (payload.eventType === "INSERT") {
              setIdeas((prev) => [...prev, payload.new as Idea]);
            } else if (payload.eventType === "UPDATE") {
              setIdeas((prev) =>
                prev.map((idea) =>
                  idea.id === payload.new.id ? (payload.new as Idea) : idea
                )
              );
            } else if (payload.eventType === "DELETE") {
              setIdeas((prev) =>
                prev.filter((idea) => idea.id !== payload.old.id)
              );
            }
          } catch (error) {
            console.error("Error handling idea update:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Idea management functions
  const addIdea = useCallback(async (eventOrCoords: React.MouseEvent | { x: number; y: number }) => {
    if (isDragging || !sessionId) return;

    let x: number, y: number;

    if ('clientX' in eventOrCoords) {
      // Handle real mouse event
      const rect = (eventOrCoords.currentTarget as HTMLElement).getBoundingClientRect();
      x = Math.max(0, eventOrCoords.clientX - rect.left - 75);
      y = Math.max(0, eventOrCoords.clientY - rect.top - 50);
    } else {
      // Handle programmatic coordinates
      x = Math.max(0, eventOrCoords.x);
      y = Math.max(0, eventOrCoords.y);
    }

    const colors = ["#fbbf24", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const { error } = await supabase.from("ideas").insert({
        session_id: sessionId,
        content: "Double-click to edit",
        x,
        y,
        color: randomColor,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error adding idea:", error);
    }
  }, [isDragging, sessionId]);

  const addRandomIdea = useCallback(() => {
    if (!sessionId) return;
    
    const x = Math.random() * (window.innerWidth - 200);
    const y = Math.random() * (window.innerHeight - 200) + 100;
    
    addIdea({ x, y });
  }, [sessionId, addIdea]);

  const updateIdeaPosition = async (id: string, x: number, y: number) => {
    try {
      await supabase
        .from("ideas")
        .update({ x: Math.max(0, x), y: Math.max(0, y) })
        .eq("id", id);
    } catch (error) {
      console.error("Error updating idea position:", error);
    }
  };

  const updateIdeaContent = async (id: string, content: string) => {
    try {
      await supabase.from("ideas").update({ content }).eq("id", id);
      setEditingId(null);
    } catch (error) {
      console.error("Error updating idea content:", error);
    }
  };

  const deleteIdea = async (id: string) => {
    try {
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
      const { error } = await supabase.from("ideas").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting idea:", error);
      fetchIdeas();
    }
  };

  // Handle idea hover events
  const handleIdeaMouseEnter = useCallback((ideaId: string) => {
    setCurrentHoveringIdeaId(ideaId);
  }, []);

  const handleIdeaMouseLeave = useCallback(() => {
    setCurrentHoveringIdeaId(null);
  }, []);

  // Get participants hovering over a specific idea
  const getIdeaHoverParticipants = useCallback((ideaId: string) => {
    return otherParticipants.filter(p => p.hovering_idea_id === ideaId);
  }, [otherParticipants]);

  // Setup all subscriptions and cleanup
  useEffect(() => {
    if (!sessionId || !myUserId || isLoading || roomNotFound) return;
    
    fetchIdeas();
    const unsubscribeIdeas = subscribeToIdeas();
    joinSession();
    const unsubscribeCursors = subscribeToCursors();

    const handleMouseMove = (e: MouseEvent) => {
      updateCursorPosition(e.clientX, e.clientY, currentHoveringIdeaId);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Set up participant cleanup interval
    participantCleanupRef.current = setInterval(cleanupOldParticipants, 30000); // Clean up every 30 seconds

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (participantCleanupRef.current) clearInterval(participantCleanupRef.current);
      leaveSession();
      unsubscribeIdeas();
      unsubscribeCursors();
    };
  }, [
    sessionId,
    myUserId,
    isLoading,
    roomNotFound,
    currentHoveringIdeaId,
    fetchIdeas,
    subscribeToIdeas,
    joinSession,
    subscribeToCursors,
    updateCursorPosition,
    leaveSession,
    cleanupOldParticipants,
  ]);

  // Show loading state while authenticating or params are being resolved
  if (isLoading || !sessionId || !myUserId) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading room...</div>
      </div>
    );
  }

  // Show room not found error
  if (roomNotFound) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Room Not Found</h2>
          <p className="text-gray-600 mb-6">The room you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg z-10 border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">{session?.title || "Brainstorming Room"}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Plus className="w-4 h-4" />
                {ideas.length} ideas
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {otherParticipants.length + 1} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Room ID and Invite Section */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg z-10 border border-white/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Invite Others</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
            <code className="text-sm text-gray-600 flex-1 font-mono">
              {sessionId?.slice(0, 8)}...
            </code>
            <button
              onClick={copyRoomId}
              className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy ID"}
            </button>
          </div>
          <p className="text-xs text-gray-500">Share this Room ID with others to collaborate</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg z-10 border border-white/20">
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Click anywhere to add an idea</p>
          <p>• Drag sticky notes to move them</p>
          <p>• Double-click to edit content</p>
          <p>• Click × to delete</p>
          <p>• Use chat to discuss ideas</p>
        </div>
      </div>

      {/* User Info */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-2 px-4 rounded-xl shadow-lg z-10 border border-white/20">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: myColor }}
          ></div>
          <span>Welcome, {myUserName}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full h-full cursor-crosshair" onClick={addIdea}>
        {ideas.map((idea) => {
          const hoverParticipants = getIdeaHoverParticipants(idea.id);
          const isBeingHovered = hoverParticipants.length > 0;
          
          return (
            <motion.div
              key={idea.id}
              className="absolute cursor-move group"
              style={{ left: `${idea.x}px`, top: `${idea.y}px` }}
              drag
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(e, info) => {
                setIsDragging(false);
                const newX = Math.max(0, idea.x + info.offset.x);
                const newY = Math.max(0, idea.y + info.offset.y);
                updateIdeaPosition(idea.id, newX, newY);
              }}
              onMouseEnter={() => handleIdeaMouseEnter(idea.id)}
              onMouseLeave={handleIdeaMouseLeave}
              whileHover={{ scale: 1.02, rotate: 1 }}
              whileDrag={{ scale: 1.05, rotate: 5, zIndex: 1000 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`w-40 h-32 p-4 rounded-lg shadow-lg border-2 backdrop-blur-sm transition-all duration-200 ${
                  isBeingHovered ? 'border-blue-400 shadow-xl' : 'border-white/50'
                }`}
                style={{ backgroundColor: `${idea.color}90` }}
              >
                {editingId === idea.id ? (
                  <textarea
                    defaultValue={idea.content}
                    className="w-full h-full bg-transparent border-none outline-none resize-none text-sm font-medium text-gray-800 placeholder-gray-500"
                    autoFocus
                    onBlur={(e) => updateIdeaContent(idea.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        updateIdeaContent(idea.id, e.currentTarget.value);
                      }
                    }}
                    placeholder="Write your idea..."
                  />
                ) : (
                  <div
                    onDoubleClick={() => setEditingId(idea.id)}
                    className="w-full h-full text-sm font-medium text-gray-800 overflow-hidden cursor-text"
                  >
                    {idea.content}
                  </div>
                )}

                <button
                  onClick={() => deleteIdea(idea.id)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                >
                  ×
                </button>

                {/* Show hover indicators */}
                {isBeingHovered && (
                  <div className="absolute -top-8 left-0 flex gap-1">
                    {hoverParticipants.map((participant, index) => (
                      <div
                        key={participant.user_id}
                        className="px-2 py-1 text-xs font-medium text-white rounded shadow-lg"
                        style={{ backgroundColor: participant.color }}
                      >
                        {participant.user_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-8 left-8 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={addRandomIdea}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Back to Dashboard Button */}
      <motion.button
        className="fixed bottom-8 left-24 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full shadow-2xl z-20 text-sm font-medium"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/dashboard")}
      >
        Back to Dashboard
      </motion.button>

      {/* Chat Component */}
      <Chat
        sessionId={sessionId}
        myUserId={myUserId}
        myUserName={myUserName}
        myColor={myColor}
      />

      {/* Live Cursors */}
      {otherParticipants.map((participant) => (
        <LiveCursor key={participant.user_id} participant={participant} />
      ))}
    </div>
  );
}