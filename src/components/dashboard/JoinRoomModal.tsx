import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
}

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  router: any;
}

export default function JoinRoomModal({ isOpen, onClose, user, router }: JoinRoomModalProps) {
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRandomColor = () => {
    const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    try {
      setIsJoiningRoom(true);
      setError(null);
      
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        setError("Please sign in to join a room.");
        router.push("/");
        return;
      }

      // Look up the room
      const { data: room, error: roomError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", joinRoomId.trim())
        .single();

      if (roomError) {
        if (roomError.code === 'PGRST116') {
          setError("Room not found. Please check the room ID.");
        } else {
          setError("Error looking up room. Please try again.");
        }
        return;
      }

      if (!room) {
        setError("Room not found. Please check the room ID.");
        return;
      }

      // Add user as participant
      const { error: participantError } = await supabase
        .from("participants")
        .upsert({
          session_id: room.id,
          user_id: currentUser.id,
          user_name: currentUser.email?.split("@")[0] || "Anonymous",
          color: getRandomColor(),
          cursor_x: 0,
          cursor_y: 0,
          last_seen: new Date().toISOString(),
        }, { onConflict: "session_id,user_id" });

      if (participantError) {
        setError(`Failed to join room: ${participantError.message || 'Unknown error'}`);
        return;
      }

      // Close modal and navigate
      onClose();
      setJoinRoomId("");
      router.push(`/room/${room.id}`);
      
    } catch (err: any) {
      setError(`Unexpected error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoiningRoom) {
      joinRoom();
    }
  };

  const handleClose = () => {
    onClose();
    setJoinRoomId("");
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
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
                onClick={handleClose}
                className="text-white/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

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
                  onClick={handleClose}
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
  );
}
