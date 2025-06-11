import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import LoadingState from "./LoadingState";
import EmptyRoomsState from "./EmptyRoomsState";
import RoomCard from "./RoomCard";

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

interface RoomsSectionProps {
  rooms: Room[];
  user: User | null;
  isLoading: boolean;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onDeleteRoom: (room: Room) => void;
  onRetry: () => void;
  isCreatingRoom: boolean;
}

export default function RoomsSection({
  rooms,
  user,
  isLoading,
  onCreateRoom,
  onJoinRoom,
  onDeleteRoom,
  onRetry,
  isCreatingRoom
}: RoomsSectionProps) {
  return (
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
            onClick={onRetry}
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
        <LoadingState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.length === 0 ? (
            <EmptyRoomsState
              onCreateRoom={onCreateRoom}
              onJoinRoom={onJoinRoom}
              isCreatingRoom={isCreatingRoom}
            />
          ) : (
            rooms.map((room, index) => (
              <RoomCard
                key={room.id}
                room={room}
                user={user}
                index={index}
                onDeleteRoom={onDeleteRoom}
              />
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}