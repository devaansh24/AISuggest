import { motion, AnimatePresence } from "framer-motion";

interface WelcomeAnimationProps {
  showWelcome: boolean;
}

export default function WelcomeAnimation({ showWelcome }: WelcomeAnimationProps) {
  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-5"
        >
          <motion.div
            className="text-center text-white/60 max-w-md mx-4"
            animate={{
              y: [-10, 10, -10],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="text-6xl lg:text-8xl mb-4"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              💡
            </motion.div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">Your Creative Canvas Awaits</h2>
            <p className="text-lg lg:text-xl">Click anywhere to spark your first brilliant idea! ✨</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}