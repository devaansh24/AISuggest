import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Copy, 
  Check, 
  Calendar, 
  ExternalLink, 
  Trash2,
  Star 
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

interface RoomCardProps {
  room: Room;
  user: User | null;
  index: number;
  onDeleteRoom: (room: Room) => void;
}

export default function RoomCard({ room, user, index, onDeleteRoom }: RoomCardProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyRoomId = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedId(roomId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
    }
  };

  return (
    <motion.div
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
            
            {user && room.created_by === user.id && (
              <motion.button
                onClick={() => onDeleteRoom(room)}
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
  );
}
