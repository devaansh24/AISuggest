"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBackground from "@/components/dashboard/Floatingbackground";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ErrorDisplay from "@/components/dashboard/ErrorDisplay";
import RoomsSection from "@/components/dashboard/RoomSection";
import JoinRoomModal from "@/components/dashboard/JoinRoomModal";
import DeleteRoomModal from "@/components/dashboard/DeleteRoomModal";



interface Room {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
}

interface User {
  id: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) {
        router.push("/");
        return;
      }
      
      setUser(user);
      await fetchRooms(user);
    } catch (err) {
      console.error("Error checking user:", err);
      setError("Failed to authenticate user");
      setIsLoading(false);
    }
  };

  const fetchRooms = async (currentUser?: User) => {
    const userToUse = currentUser || user;
    if (!userToUse) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch rooms created by the user
      const { data: createdRooms, error: createdError } = await supabase
        .from("sessions")
        .select("*")
        .eq("created_by", userToUse.id)
        .order("created_at", { ascending: false });

      // Fetch rooms where user has participated
      const { data: participants, error: participantsError } = await supabase
        .from("participants")
        .select("session_id")
        .eq("user_id", userToUse.id);

      // Combine and deduplicate rooms
      const allRooms = new Map<string, Room>();
      
      if (createdRooms && Array.isArray(createdRooms)) {
        createdRooms.forEach(room => allRooms.set(room.id, room));
      }

      if (participants && Array.isArray(participants) && participants.length > 0) {
        const sessionIds = participants.map(p => p.session_id);
        const { data: participatedSessions, error: participatedError } = await supabase
          .from("sessions")
          .select("*")
          .in("id", sessionIds);
        
        if (participatedSessions && Array.isArray(participatedSessions)) {
          participatedSessions.forEach(room => allRooms.set(room.id, room));
        }
      }

      const finalRooms = Array.from(allRooms.values());
      setRooms(finalRooms);
      
      if (!createdError && !participantsError) {
        setError(null);
      }
      
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    try {
      setIsCreatingRoom(true);
      setError(null);
      
      const roomTitle = `Brainstorming Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      const { data: room, error: roomError } = await supabase
        .from("sessions")
        .insert({
          title: roomTitle,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;
      
      if (room) {
        const { error: participantError } = await supabase
          .from("participants")
          .insert({
            session_id: room.id,
            user_id: user.id,
            user_name: user.email?.split("@")[0] || "Anonymous",
            color: "#3b82f6",
            cursor_x: 0,
            cursor_y: 0,
            last_seen: new Date().toISOString(),
          });
          
        router.push(`/room/${room.id}`);
      }
    } catch (err: any) {
      setError(`Failed to create room: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const deleteRoom = async () => {
    if (!roomToDelete || !user) return;

    try {
      setError(null);

      if (roomToDelete.created_by !== user.id) {
        setError("You can only delete rooms you created");
        return;
      }

      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", roomToDelete.id)
        .eq("created_by", user.id);

      if (error) throw error;

      setRooms(prev => prev.filter(room => room.id !== roomToDelete.id));
      setShowDeleteModal(false);
      setRoomToDelete(null);
      
    } catch (err) {
      setError(`Failed to delete room: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const retryFetchRooms = () => {
    setError(null);
    setIsLoading(true);
    fetchRooms();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 relative overflow-hidden">
      <FloatingBackground />

      <DashboardHeader
        user={user}
        onCreateRoom={createRoom}
        onJoinRoom={() => setShowInviteModal(true)}
        onSignOut={handleSignOut}
        isCreatingRoom={isCreatingRoom}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-8">
        <AnimatePresence>
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={retryFetchRooms}
            />
          )}
        </AnimatePresence>

        <RoomsSection
          rooms={rooms}
          user={user}
          isLoading={isLoading}
          onCreateRoom={createRoom}
          onJoinRoom={() => setShowInviteModal(true)}
          onDeleteRoom={(room) => {
            setRoomToDelete(room);
            setShowDeleteModal(true);
          }}
          onRetry={retryFetchRooms}
          isCreatingRoom={isCreatingRoom}
        />

        <JoinRoomModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          user={user}
          router={router}
        />

        <DeleteRoomModal
          isOpen={showDeleteModal}
          room={roomToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setRoomToDelete(null);
          }}
          onDelete={deleteRoom}
        />
      </div>
    </div>
  );
}