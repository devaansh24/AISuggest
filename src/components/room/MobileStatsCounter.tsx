import { motion } from "framer-motion";
import { Lightbulb, Users } from "lucide-react";

interface MobileStatsCounterProps {
  ideasCount: number;
  participantsCount: number;
}

export default function MobileStatsCounter({
  ideasCount,
  participantsCount,
}: MobileStatsCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl border border-white/20 z-10 lg:hidden"
    >
      <div className="flex items-center gap-2 text-sm text-white">
        <Lightbulb className="w-4 h-4 text-yellow-300" />
        <span>{ideasCount} ideas</span>
        <Users className="w-4 h-4 ml-2" />
        <span>{participantsCount}</span>
      </div>
    </motion.div>
  );
}