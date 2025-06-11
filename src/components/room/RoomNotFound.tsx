// src/components/room/RoomNotFound.tsx
import { motion } from "framer-motion";
import { Zap, Home } from "lucide-react";

interface RoomNotFoundProps {
  onBackToDashboard: () => void;
}

export default function RoomNotFound({ onBackToDashboard }: RoomNotFoundProps) {
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
        <p className="text-white/80 mb-6">This creative space doesn&apos;t exist or has been archived. Let&apos;s get you back to innovation!</p>
        <motion.button
          onClick={onBackToDashboard}
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