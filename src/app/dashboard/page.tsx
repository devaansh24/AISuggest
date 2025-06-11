"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, 
  Check, 
  Users, 
  Calendar, 
  ExternalLink, 
  LogOut, 
  Plus,
  Sparkles,
  Lightbulb,
  Zap,
  Star,
  Rocket,
  RefreshCw,
  UserPlus,
  X,
  Trash2,
  AlertTriangle
} from "lucide-react";

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

interface Participant {
  session_id: string;
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
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [floatingElements, setFloatingElements] = useState([]);

  // Creative floating elements
  useEffect(() => {
    const elements = [
      { id: 1, icon: "💡", x: 5, y: 10, delay: 0, duration: 6 },
      { id: 2, icon: "🚀", x: 90, y: 15, delay: 1, duration: 8 },
      { id: 3, icon: "✨", x: 15, y: 85, delay: 2, duration: 7 },
      { id: 4, icon: "🎯", x: 85, y: 80, delay: 3, duration: 9 },
      { id: 5, icon: "🌟", x: 50, y: 5, delay: 4, duration: 6 },
      { id: 6, icon: "💫", x: 10, y: 50, delay: 5, duration: 8 },
      { id: 7, icon: "🔥", x: 95, y: 50, delay: 6, duration: 7 },
    ];
    setFloatingElements(elements);
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Auth error:", error);
        throw error;
      }
      
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/");
        return;
      }
      
      console.log("User found:", user.id);
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
      console.log("No user available for fetching rooms");
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Fetching rooms for user:", userToUse.id);
      
      // Fetch rooms created by the user
      const { data: createdRooms, error: createdError } = await supabase
        .from("sessions")
        .select("*")
        .eq("created_by", userToUse.id)
        .order("created_at", { ascending: false });

      console.log("Created rooms query result:", { createdRooms, createdError });

      if (createdError) {
        console.error("Error fetching created rooms:", createdError);
      }

      // Fetch rooms where user has participated
      const { data: participants, error: participantsError } = await supabase
        .from("participants")
        .select("session_id")
        .eq("user_id", userToUse.id);
      
      console.log("Participants query result:", { participants, participantsError });

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
      }

      // Combine and deduplicate rooms
      const allRooms = new Map<string, Room>();
      
      // Add created rooms
      if (createdRooms && Array.isArray(createdRooms)) {
        console.log("Adding created rooms:", createdRooms.length);
        createdRooms.forEach(room => allRooms.set(room.id, room));
      }

      // Add participated rooms
      if (participants && Array.isArray(participants) && participants.length > 0) {
        console.log("Fetching participated sessions for:", participants.length, "participants");
        const sessionIds = participants.map(p => p.session_id);
        const { data: participatedSessions, error: participatedError } = await supabase
          .from("sessions")
          .select("*")
          .in("id", sessionIds);
        
        console.log("Participated sessions query result:", { participatedSessions, participatedError });
        
        if (participatedError) {
          console.error("Error fetching participated sessions:", participatedError);
        }
        
        if (participatedSessions && Array.isArray(participatedSessions)) {
          console.log("Adding participated rooms:", participatedSessions.length);
          participatedSessions.forEach(room => allRooms.set(room.id, room));
        }
      }

      const finalRooms = Array.from(allRooms.values());
      console.log("Final rooms count:", finalRooms.length);
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
      console.log("No user available for room creation");
      router.push("/");
      return;
    }

    try {
      setIsCreatingRoom(true);
      setError(null);
      
      const roomTitle = `Brainstorming Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      console.log("Creating room with title:", roomTitle);
      
      const { data: room, error: roomError } = await supabase
        .from("sessions")
        .insert({
          title: roomTitle,
          created_by: user.id
        })
        .select()
        .single();

      console.log("Room creation result:", { room, roomError });

      if (roomError) {
        console.error("Room creation error:", roomError);
        throw roomError;
      }
      
      if (room) {
        console.log("Adding creator as participant");
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
          
        if (participantError) {
          console.error("Error adding participant:", participantError);
        }
          
        router.push(`/room/${room.id}`);
      } else {
        throw new Error("Room creation returned no data");
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setError(`Failed to create room: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const deleteRoom = async () => {
    if (!roomToDelete || !user) return;

    try {
      setIsDeletingRoom(true);
      setError(null);

      // Check if user is the owner of the room
      if (roomToDelete.created_by !== user.id) {
        setError("You can only delete rooms you created");
        return;
      }

      // Delete the room (CASCADE will handle related records)
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", roomToDelete.id)
        .eq("created_by", user.id); // Extra safety check

      if (error) {
        console.error("Error deleting room:", error);
        throw error;
      }

      // Remove from local state
      setRooms(prev => prev.filter(room => room.id !== roomToDelete.id));
      
      // Close modal
      setShowDeleteModal(false);
      setRoomToDelete(null);
      
    } catch (err) {
      console.error("Error deleting room:", err);
      setError(`Failed to delete room: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeletingRoom(false);
    }
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    if (!user) {
      console.log("No user available for joining room");
      router.push("/");
      return;
    }

    try {
      setIsJoiningRoom(true);
      setError(null);
      console.log("Joining room:", joinRoomId.trim());
      
      const { data: room, error: roomError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", joinRoomId.trim())
        .single();

      console.log("Room lookup result:", { room, roomError });

      if (roomError || !room) {
        console.error("Room not found:", roomError);
        setError("Room not found. Please check the room ID.");
        return;
      }

      console.log("Adding user as participant");
      const { error: participantError } = await supabase
        .from("participants")
        .upsert({
          session_id: room.id,
          user_id: user.id,
          user_name: user.email?.split("@")[0] || "Anonymous",
          color: getRandomColor(),
          cursor_x: 0,
          cursor_y: 0,
          last_seen: new Date().toISOString(),
        }, { onConflict: "session_id,user_id" });

      if (participantError) {
        console.error("Error joining as participant:", participantError);
        setError(`Failed to join room: ${participantError.message}`);
        return;
      }

      // Close modal and navigate
      setShowInviteModal(false);
      setJoinRoomId("");
      router.push(`/room/${room.id}`);
    } catch (err) {
      console.error("Error joining room:", err);
      setError(`Failed to join room: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const getRandomColor = () => {
    const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const copyRoomId = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedId(roomId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
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

  const getUserDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  const retryFetchRooms = () => {
    setError(null);
    setIsLoading(true);
    fetchRooms();
  };

  const closeModal = () => {
    setShowInviteModal(false);
    setJoinRoomId("");
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setRoomToDelete(null);
  };

  const openDeleteModal = (room: Room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoiningRoom) {
      joinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 relative overflow-hidden">
      {/* Floating Background Elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute text-2xl opacity-10 pointer-events-none z-0"
          style={{ left: `${element.x}%`, top: `${element.y}%` }}
          animate={{
            y: [-15, 15, -15],
            x: [-10, 10, -10],
            rotate: [-5, 5, -5],
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

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 5 }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20"
      >
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <motion.div
                className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Lightbulb className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Ideas<span className="text-yellow-300">Flow</span>
                </h1>
                {user && (
                  <p className="text-white/80 mt-1">
                    Welcome back, <span className="font-medium text-cyan-300">{getUserDisplayName(user.email)}</span> ✨
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={() => setShowInviteModal(true)}
                className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl flex items-center gap-2 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus className="w-5 h-5" />
                Join Room
              </motion.button>
              
              <motion.button
                onClick={createRoom}
                disabled={isCreatingRoom}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-3 rounded-2xl hover:from-blue-500 hover:to-purple-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCreatingRoom ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Room
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={handleSignOut}
                className="bg-white/20 text-white px-4 py-3 rounded-2xl hover:bg-white/30 transition-all duration-300 font-medium shadow-lg flex items-center gap-2 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-8">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-red-500/20 backdrop-blur-xl border border-red-400/30 text-red-100 px-6 py-4 rounded-2xl mb-6 flex justify-between items-center shadow-lg"
            >
              <span>{error}</span>
              <motion.button
                onClick={retryFetchRooms}
                className="bg-red-400/30 hover:bg-red-400/50 text-red-100 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rooms Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-yellow-300" />
                Your Creative Spaces
              </h2>
              <p className="text-white/70 mt-1">Where brilliant ideas come to life</p>
            </motion.div>
            
            {!isLoading && (
              <motion.button
                onClick={retryFetchRooms}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
            )}
          </div>
          
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col justify-center items-center h-96 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20"
            >
              <motion.div
                className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-xl text-white/80">Loading your creative spaces...</p>
              <p className="text-white/60 mt-2">✨ Getting everything ready for innovation</p>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="col-span-full"
                >
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 text-center">
                    <motion.div
                      className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl mb-6 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Rocket className="w-12 h-12 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">Ready to Launch Ideas? 🚀</h3>
                    <p className="text-white/70 mb-8 text-lg">Your creative journey starts here. Create your first room and watch magic happen!</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        onClick={createRoom}
                        disabled={isCreatingRoom}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCreatingRoom ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Creating Magic...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            Create Your First Room
                          </>
                        )}
                      </motion.button>
                      
                      <motion.button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <UserPlus className="w-5 h-5" />
                        Join Existing Room
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                rooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 overflow-hidden group hover:bg-white/15"
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-white line-clamp-2 group-hover:text-yellow-300 transition-colors flex-1 mr-2">
                          {room.title}
                        </h3>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => copyRoomId(room.id)}
                            className="text-white/60 hover:text-cyan-300 transition-colors p-2 rounded-xl hover:bg-white/10"
                            title="Copy Room ID"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {copiedId === room.id ? (
                              <Check className="w-5 h-5 text-green-400" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </motion.button>
                          
                          {/* Show delete button only for rooms created by current user */}
                          {user && room.created_by === user.id && (
                            <motion.button
                              onClick={() => openDeleteModal(room)}
                              className="text-white/60 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-white/10"
                              title="Delete Room"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-5 h-5" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Calendar className="w-4 h-4 text-purple-300" />
                          <span>Created: {new Date(room.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                          <p className="text-xs text-white/60 mb-2 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Room ID (Share to invite others):
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-white/90 bg-black/20 px-3 py-2 rounded-xl border border-white/10 flex-1 truncate">
                              {room.id}
                            </code>
                            <motion.button
                              onClick={() => copyRoomId(room.id)}
                              className="text-white/60 hover:text-cyan-300 transition-colors p-2 rounded-xl hover:bg-white/10"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {copiedId === room.id ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => router.push(`/room/${room.id}`)}
                        className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white py-3 px-4 rounded-2xl transition-all duration-300 font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ExternalLink className="w-5 h-5" />
                        Enter Creative Space
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>

        {/* Join Room Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="text-center flex-1">
                    <motion.div
                      className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-4 shadow-lg mx-auto"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <UserPlus className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Join Creative Space</h3>
                    <p className="text-white/70">Enter a room ID to join an existing brainstorming session</p>
                  </div>
                  
                  <motion.button
                    onClick={closeModal}
                    className="text-white/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-3">
                      Room ID
                    </label>
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter room ID to join..."
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm"
                      disabled={isJoiningRoom}
                    />
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={closeModal}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-2xl transition-all duration-300 font-medium border border-white/20"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      onClick={joinRoom}
                      disabled={isJoiningRoom || !joinRoomId.trim()}
                      className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white py-3 px-4 rounded-2xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isJoiningRoom ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Joining...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Join Room
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Room Modal */}
        <AnimatePresence>
          {showDeleteModal && roomToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={closeDeleteModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl mb-4 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Delete Room</h3>
                  <p className="text-white/70">Are you sure you want to delete this room? This action cannot be undone.</p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl mb-6 border border-white/20">
                  <p className="text-white/80 text-sm mb-1">Room to delete:</p>
                  <p className="text-white font-medium">{roomToDelete.title}</p>
                  <p className="text-white/60 text-xs mt-1">ID: {roomToDelete.id}</p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={closeDeleteModal}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-2xl transition-all duration-300 font-medium border border-white/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    onClick={deleteRoom}
                    disabled={isDeletingRoom}
                    className="flex-1 bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white py-3 px-4 rounded-2xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isDeletingRoom ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Delete Room
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}