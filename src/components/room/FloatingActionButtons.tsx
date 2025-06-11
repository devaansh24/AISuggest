import { motion } from "framer-motion";
import { Plus, Home } from "lucide-react";

interface FloatingActionButtonsProps {
  onAddRandomIdea: () => void;
  onBackToDashboard: () => void;
}

export default function FloatingActionButtons({
  onAddRandomIdea,
  onBackToDashboard,
}: FloatingActionButtonsProps) {
  return (
    <div className="fixed bottom-4 left-4 lg:bottom-8 lg:left-8 flex flex-col gap-3 z-20">
      {/* Add Random Idea */}
      <motion.button
        className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white p-3 lg:p-4 rounded-2xl shadow-2xl border border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddRandomIdea}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        title="Add Random Idea"
      >
        <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
      </motion.button>

      {/* Back to Dashboard */}
      <motion.button
        className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-3 py-2 lg:px-4 lg:py-3 rounded-2xl shadow-2xl text-sm lg:text-base font-medium border border-white/20 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBackToDashboard}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        title="Back to Dashboard"
      >
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="hidden lg:inline">Dashboard</span>
        </div>
      </motion.button>
    </div>
  );
}