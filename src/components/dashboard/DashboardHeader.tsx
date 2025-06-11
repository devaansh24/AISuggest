import { motion } from "framer-motion";
import { Lightbulb, Plus, UserPlus, LogOut } from "lucide-react";

interface User {
  id: string;
  email: string;
}

interface DashboardHeaderProps {
  user: User | null;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSignOut: () => void;
  isCreatingRoom: boolean;
}

export default function DashboardHeader({
  user,
  onCreateRoom,
  onJoinRoom,
  onSignOut,
  isCreatingRoom
}: DashboardHeaderProps) {
  const getUserDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  return (
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
              onClick={onJoinRoom}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl flex items-center gap-2 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserPlus className="w-5 h-5" />
              Join Room
            </motion.button>
            
            <motion.button
              onClick={onCreateRoom}
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
              onClick={onSignOut}
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
  );
}