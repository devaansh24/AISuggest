import { motion, AnimatePresence } from "framer-motion";

interface CelebrationEffectProps {
  shouldCelebrate: boolean;
}

export default function CelebrationEffect({ shouldCelebrate }: CelebrationEffectProps) {
  return (
    <AnimatePresence>
      {shouldCelebrate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none z-30"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 360],
                y: [-50, -100],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            >
              {["🎉", "✨", "🚀", "💫", "🌟"][i % 5]}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}