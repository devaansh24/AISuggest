import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";

interface Room {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
}

interface DeleteRoomModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteRoomModal({ isOpen, room, onClose, onDelete }: DeleteRoomModalProps) {
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  const handleDelete = async () => {
    setIsDeletingRoom(true);
    try {
      await onDelete();
    } finally {
      setIsDeletingRoom(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && room && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
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
              <p className="text-white font-medium">{room.title}</p>
              <p className="text-white/60 text-xs mt-1">ID: {room.id}</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-2xl transition-all duration-300 font-medium border border-white/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={handleDelete}
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
  );
}