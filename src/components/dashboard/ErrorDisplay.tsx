import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="bg-red-500/20 backdrop-blur-xl border border-red-400/30 text-red-100 px-6 py-4 rounded-2xl mb-6 flex justify-between items-center shadow-lg"
    >
      <span>{error}</span>
      <motion.button
        onClick={onRetry}
        className="bg-red-400/30 hover:bg-red-400/50 text-red-100 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </motion.button>
    </motion.div>
  );
}