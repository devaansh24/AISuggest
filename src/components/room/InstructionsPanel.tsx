import { motion, AnimatePresence } from "framer-motion";
import { Settings, Star } from "lucide-react";

interface InstructionsPanelProps {
  showInstructions: boolean;
  onToggle: () => void;
}

export default function InstructionsPanel({
  showInstructions,
  onToggle,
}: InstructionsPanelProps) {
  return (
    <>
      {/* Instructions Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 bg-white/10 backdrop-blur-xl p-3 rounded-full shadow-2xl z-10 border border-white/20 hover:bg-white/20 transition-all duration-300"
        onClick={onToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Show Instructions"
      >
        <Settings className="w-5 h-5 text-white" />
      </motion.button>

      {/* Instructions Panel */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-4 lg:bottom-20 lg:right-6 bg-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl z-10 border border-white/20 max-w-xs"
          >
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-300" />
              Creative Controls
            </h3>
            <div className="text-sm text-white/80 space-y-2">
              <p>✨ <strong>Click anywhere</strong> to spark an idea</p>
              <p>🚀 <strong>Drag notes</strong> to organize thoughts</p>
              <p>✍️ <strong>Double-click</strong> to edit content</p>
              <p>🗑️ <strong>Click ×</strong> to remove ideas</p>
              <p>💬 <strong>Use chat</strong> to collaborate</p>
              <p>🎨 <strong>Ideas auto-color</strong> for visual magic</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}