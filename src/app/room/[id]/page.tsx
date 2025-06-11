"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {  AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";


import RoomHeader from "@/components/room/RoomHeader";
import FloatingBackground from "@/components/room/FloatingBackground";
import RoomNotFound from "@/components/room/RoomNotFound";
import LoadingScreen from "@/components/room/LoadingScreen";
import InstructionsPanel from "@/components/room/InstructionsPanel";
import IdeaCard from "@/components/room/IdeaCard";
import FloatingActionButtons from "@/components/room/FloatingActionButtons";
import MobileStatsCounter from "@/components/room/MobileStatsCounter";
import Chat from "@/components/room/Chat";
import LiveCursor from "@/components/room/LiveCursor";
import WelcomeAnimation from "@/components/room/WelcomeAnimation";
import { useMemo } from "react";


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

// Add interface for background elements
interface BackgroundElement {
  id: number;
  icon: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  
  // Core state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [otherParticipants, setOtherParticipants] = useState<Participant[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);
  
  // UI state
  const [copied, setCopied] = useState(false);
  const [currentHoveringIdeaId, setCurrentHoveringIdeaId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  // Fix: Add proper type annotation for backgroundElements
  const [backgroundElements, setBackgroundElements] = useState<BackgroundElement[]>([]);
  
  // User info state
  const [myUserId, setMyUserId] = useState<string>("");
  const [myUserName, setMyUserName] = useState<string>("");
  const [myColor, setMyColor] = useState<string>("");
  
  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const participantCleanupRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Enhanced color palette
  const ideaColors = useMemo(() => [
  "#FFE066", "#FF6B9D", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
], []);

  // Initialize floating background elements
  useEffect(() => {
    const elements: BackgroundElement[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      icon: ["💡", "✨", "🚀", "🌟", "⚡", "🎯", "💫", "🔮"][i % 8],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 0.5,
      duration: 3 + Math.random() * 2,
    }));
    setBackgroundElements(elements);
  }, []);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (!user) {
          router.push("/");
          return;
        }
        

        setMyUserId(user.id);
        setMyUserName(user.email?.split("@")[0] || "Anonymous");
        
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
  
  // Resolve params and check session
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const roomId = resolvedParams.id;
      setSessionId(roomId);
      
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

  // Room functionality hooks
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

  const cleanupOldParticipants = useCallback(() => {
    if (!sessionId) return;
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    setOtherParticipants(prev => 
      prev.filter(p => new Date(p.last_seen) > fiveMinutesAgo)
    );
  }, [sessionId]);

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
              const newIdea = payload.new as Idea;
              setIdeas((prev) => {
                if (prev.find(idea => idea.id === newIdea.id)) {
                  return prev;
                }
                return [...prev, newIdea];
              });
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
 const addIdea = useCallback(async (event: React.MouseEvent) => {
    if (isDragging || !sessionId || !canvasRef.current) return;

    event.stopPropagation();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, event.clientX - rect.left - 75);
    const y = Math.max(0, event.clientY - rect.top - 50);

    const randomColor = ideaColors[Math.floor(Math.random() * ideaColors.length)];

    try {
      const { data, error } = await supabase.from("ideas").insert({
        session_id: sessionId,
        content: "✨ Double-click to edit",
        x,
        y,
        color: randomColor,
      }).select().single();

      if (error) throw error;
      
      if (data) {
        setIdeas((prev) => {
          if (prev.find(idea => idea.id === data.id)) {
            return prev;
          }
          return [...prev, data];
        });
      }
    } catch (error) {
      console.error("Error adding idea:", error);
    }
  }, [isDragging, sessionId,ideaColors]);

  const addRandomIdea = useCallback(() => {
    if (!sessionId || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.random() * (rect.width - 250);
    const y = Math.random() * (rect.height - 200) + 120;
    
    const syntheticEvent = {
      clientX: rect.left + x + 75,
      clientY: rect.top + y + 50,
      stopPropagation: () => {},
    } as React.MouseEvent;
    
    addIdea(syntheticEvent);
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

  const handleIdeaMouseEnter = useCallback((ideaId: string) => {
    setCurrentHoveringIdeaId(ideaId);
  }, []);

  const handleIdeaMouseLeave = useCallback(() => {
    setCurrentHoveringIdeaId(null);
  }, []);

  const getIdeaHoverParticipants = useCallback((ideaId: string) => {
    return otherParticipants.filter(p => p.hovering_idea_id === ideaId);
  }, [otherParticipants]);

  // Setup subscriptions and cleanup
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
    sessionId, myUserId, isLoading, roomNotFound, currentHoveringIdeaId,
    fetchIdeas, subscribeToIdeas, joinSession, subscribeToCursors,
    updateCursorPosition, leaveSession, cleanupOldParticipants,
  ]);

  // Show loading state
  if (isLoading || !sessionId || !myUserId) {
    return <LoadingScreen />;
  }

  // Show room not found error
  if (roomNotFound) {
    return <RoomNotFound onBackToDashboard={() => router.push("/dashboard")} />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 relative overflow-hidden">
      {/* Background Elements */}
      <FloatingBackground backgroundElements={backgroundElements} />

      {/* Header */}
      <RoomHeader
        session={session}
        ideas={ideas}
        otherParticipants={otherParticipants}
        sessionId={sessionId}
        copied={copied}
        myUserName={myUserName}
        myColor={myColor}
        onCopyRoomId={copyRoomId}
      />

      {/* Instructions Panel */}
      <InstructionsPanel
        showInstructions={showInstructions}
        onToggle={() => setShowInstructions(!showInstructions)}
      />

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="w-full h-full cursor-crosshair" 
        onClick={addIdea}
        style={{ position: 'relative' }}
      >
        <AnimatePresence>
          {ideas.map((idea) => {
            const hoverParticipants = getIdeaHoverParticipants(idea.id);
            const isBeingHovered = hoverParticipants.length > 0;
            
            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                editingId={editingId}
                isBeingHovered={isBeingHovered}
                hoverParticipants={hoverParticipants}
                onEdit={setEditingId}
                onUpdateContent={updateIdeaContent}
                onUpdatePosition={updateIdeaPosition}
                onDelete={deleteIdea}
                onMouseEnter={handleIdeaMouseEnter}
                onMouseLeave={handleIdeaMouseLeave}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onAddRandomIdea={addRandomIdea}
        onBackToDashboard={() => router.push("/dashboard")}
      />

      {/* Mobile Stats Counter */}
      <MobileStatsCounter
        ideasCount={ideas.length}
        participantsCount={otherParticipants.length + 1}
      />

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

      {/* Welcome Animation */}
      <WelcomeAnimation showWelcome={ideas.length === 0} />

      {/* Celebration Effect */}
      {/* <CelebrationEffect shouldCelebrate={ideas.length > 0 && ideas.length % 5 === 0} /> */}
    </div>
  );
}