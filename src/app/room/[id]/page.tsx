"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Users, 
  Copy, 
  Share2, 
  Check, 
  Lightbulb, 
  Sparkles, 
  Zap,
  Home,
  Palette,
  MessageCircle,
  Settings,
  Star,
  Brain,
  Rocket
} from "lucide-react";
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [backgroundElements, setBackgroundElements] = useState([]);
  
  // User info state
  const [myUserId, setMyUserId] = useState<string>("");
  const [myUserName, setMyUserName] = useState<string>("");
  const [myColor, setMyColor] = useState<string>("");
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const participantCleanupRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced color palette
  const ideaColors = [
    "#FFE066", // Warm yellow
    "#FF6B9D", // Pink
    "#4ECDC4", // Teal
    "#45B7D1", // Sky blue
    "#96CEB4", // Mint green
    "#FFEAA7", // Light yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Golden
    "#BB8FCE", // Light purple
  ];

  // Floating background elements
  useEffect(() => {
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      icon: ["💡", "✨", "🚀", "🌟", "⚡", "🎯", "💫", "🔮"][i % 8],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 0.5,
      duration: 3 + Math.random() * 2,
    }));
    setBackgroundElements(elements);
  }, []);

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
        
        // Enhanced color palette for users
        const userColors = ["#FF6B9D", "#4ECDC4", "#45B7D1", "#96CEB4", "#DDA0DD", "#F7DC6F"];
        const userColorIndex = user.id.charCodeAt(0) % userColors.length;
        setMyColor(userColors[userColorIndex]);
        
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

    const randomColor = ideaColors[Math.floor(Math.random() * ideaColors.length)];

    try {
      const { error } = await supabase.from("ideas").insert({
        session_id: sessionId,
        content: "✨ Double-click to edit",
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
    
    const x = Math.random() * (window.innerWidth - 250);
    const y = Math.random() * (window.innerHeight - 200) + 120;
    
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
    participantCleanupRef.current = setInterval(cleanupOldParticipants, 30000);

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

  // Show loading state
  if (isLoading || !sessionId || !myUserId) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, delay: 4 }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 text-center"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Creative Space</h2>
          <p className="text-white/80">Preparing the innovation canvas...</p>
        </motion.div>
      </div>
    );
  }

  // Show room not found error
  if (roomNotFound) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <motion.div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 text-center max-w-md mx-4"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-4">Oops! Room Not Found</h2>
          <p className="text-white/80 mb-6">This creative space doesn't exist or has been archived. Let's get you back to innovation!</p>
          <motion.button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Back to Dashboard
            </div>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
        
        {/* Floating icons */}
        {backgroundElements.map((element) => (
          <motion.div
            key={element.id}
            className="absolute text-2xl opacity-10"
            style={{ left: `${element.x}%`, top: `${element.y}%` }}
            animate={{
              y: [-20, 20, -20],
              rotate: [-10, 10, -10],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: element.duration,
              repeat: Infinity,
              delay: element.delay,
              ease: "easeInOut",
            }}
          >
            {element.icon}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 lg:top-6 lg:left-6 bg-white/10 backdrop-blur-xl p-3 lg:p-4 rounded-2xl shadow-2xl z-10 border border-white/20"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div>
            <h1 className="font-bold text-lg text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-300" />
              {session?.title || "Brainstorming Room"}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {ideas.length} ideas
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {otherParticipants.length + 1} creators
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Room ID and Invite Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 right-4 lg:top-6 lg:right-6 bg-white/10 backdrop-blur-xl p-3 lg:p-4 rounded-2xl shadow-2xl z-10 border border-white/20"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-white/80" />
            <span className="text-sm font-medium text-white">Invite Creators</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/20">
            <code className="text-sm text-white/90 flex-1 font-mono">
              {sessionId?.slice(0, 8)}...
            </code>
            <motion.button
              onClick={copyRoomId}
              className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-3 py-1 rounded-xl text-xs font-medium transition-all duration-300 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy"}
            </motion.button>
          </div>
          <p className="text-xs text-white/60">Share this Room ID to collaborate</p>
        </div>
      </motion.div>

      {/* User Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl p-2 px-4 rounded-xl shadow-2xl z-10 border border-white/20"
      >
        <div className="flex items-center gap-2 text-sm text-white">
          <motion.div 
            className="w-3 h-3 rounded-full border-2 border-white/50" 
            style={{ backgroundColor: myColor }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <span>Welcome, <span className="font-medium">{myUserName}</span> ✨</span>
        </div>
      </motion.div>

      {/* Instructions Toggle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 bg-white/10 backdrop-blur-xl p-3 rounded-full shadow-2xl z-10 border border-white/20 hover:bg-white/20 transition-all duration-300"
        onClick={() => setShowInstructions(!showInstructions)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Settings className="w-5 h-5 text-white" />
      </motion.button>

      {/* Instructions Panel */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-4 lg:bottom-20 lg:right-6 bg-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl z-10 border border-white/20 max-w-xs"
          >
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-300" />
              Creative Controls
            </h3>
            <div className="text-sm text-white/80 space-y-2">
              <p>✨ <strong>Click anywhere</strong> to spark an idea</p>
              <p>🚀 <strong>Drag notes</strong> to organize thoughts</p>
              <p>✍️ <strong>Double-click</strong> to edit content</p>
              <p>🗑️ <strong>Click ×</strong> to remove ideas</p>
              <p>💬 <strong>Use chat</strong> to collaborate</p>
              <p>🎨 <strong>Ideas auto-color</strong> for visual magic</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="w-full h-full cursor-crosshair" onClick={addIdea}>
        <AnimatePresence>
          {ideas.map((idea) => {
            const hoverParticipants = getIdeaHoverParticipants(idea.id);
            const isBeingHovered = hoverParticipants.length > 0;
            
            return (
              <motion.div
                key={idea.id}
                className="absolute cursor-move group"
                style={{ left: `${idea.x}px`, top: `${idea.y}px` }}
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
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
                whileHover={{ 
                  scale: 1.05, 
                  rotate: 2,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                whileDrag={{ 
                  scale: 1.1, 
                  rotate: 5, 
                  zIndex: 1000,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
                }}
                onClick={(e) => e.stopPropagation()}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div
                  className={`w-40 h-32 lg:w-48 lg:h-36 p-4 rounded-2xl shadow-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
                    isBeingHovered 
                      ? 'border-white/60 shadow-2xl ring-4 ring-white/20' 
                      : 'border-white/30'
                  }`}
                  style={{ 
                    backgroundColor: idea.color,
                    boxShadow: isBeingHovered 
                      ? `0 20px 40px -12px ${idea.color}40, 0 0 0 1px rgba(255,255,255,0.1)` 
                      : `0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)`
                  }}
                >
                  {editingId === idea.id ? (
                    <textarea
                      defaultValue={idea.content}
                      className="w-full h-full bg-transparent border-none outline-none resize-none text-sm lg:text-base font-medium text-gray-800 placeholder-gray-600"
                      autoFocus
                      onBlur={(e) => updateIdeaContent(idea.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          updateIdeaContent(idea.id, e.currentTarget.value);
                        }
                      }}
                      placeholder="✨ Your brilliant idea..."
                    />
                  ) : (
                    <div
                      onDoubleClick={() => setEditingId(idea.id)}
                      className="w-full h-full text-sm lg:text-base font-medium text-gray-800 overflow-hidden cursor-text leading-relaxed"
                    >
                      {idea.content}
                    </div>
                  )}

                  <motion.button
                    onClick={() => deleteIdea(idea.id)}
                    className="absolute -top-3 -right-3 bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white rounded-full w-7 h-7 text-lg font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ×
                  </motion.button>

                  {/* Collaboration indicators */}
                  {isBeingHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-12 left-0 flex gap-1 flex-wrap max-w-48"
                    >
                      {hoverParticipants.map((participant) => (
                        <motion.div
                          key={participant.user_id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-2 py-1 text-xs font-medium text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20"
                          style={{ backgroundColor: `${participant.color}90` }}
                        >
                          👀 {participant.user_name}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Idea sparkle effect */}
                  <motion.div
                    className="absolute -top-1 -right-1 text-yellow-300"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ✨
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 left-4 lg:bottom-8 lg:left-8 flex flex-col gap-3 z-20">
        {/* Add Random Idea */}
        <motion.button
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white p-3 lg:p-4 rounded-2xl shadow-2xl border border-white/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={addRandomIdea}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
        </motion.button>

        {/* Back to Dashboard */}
        <motion.button
          className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-3 py-2 lg:px-4 lg:py-3 rounded-2xl shadow-2xl text-sm lg:text-base font-medium border border-white/20 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/dashboard")}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden lg:inline">Dashboard</span>
          </div>
        </motion.button>
      </div>

      {/* Ideas Counter - Mobile Friendly */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl border border-white/20 z-10 lg:hidden"
      >
        <div className="flex items-center gap-2 text-sm text-white">
          <Lightbulb className="w-4 h-4 text-yellow-300" />
          <span>{ideas.length} ideas</span>
          <Users className="w-4 h-4 ml-2" />
          <span>{otherParticipants.length + 1}</span>
        </div>
      </motion.div>

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

      {/* Welcome Animation for First Visit */}
      <AnimatePresence>
        {ideas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-5"
          >
            <motion.div
              className="text-center text-white/60 max-w-md mx-4"
              animate={{
                y: [-10, 10, -10],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div
                className="text-6xl lg:text-8xl mb-4"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                💡
              </motion.div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">Your Creative Canvas Awaits</h2>
              <p className="text-lg lg:text-xl">Click anywhere to spark your first brilliant idea! ✨</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Effect for New Ideas */}
      <AnimatePresence>
        {ideas.length > 0 && ideas.length % 5 === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 360],
                  y: [-50, -100],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              >
                {["🎉", "✨", "🚀", "💫", "🌟"][i % 5]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}