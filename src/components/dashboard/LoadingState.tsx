import { motion } from "framer-motion";

export default function LoadingState() {
  return (
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
  );
}