import { motion } from "framer-motion";

interface FloatingBackgroundProps {
  backgroundElements: Array<{
    id: number;
    icon: string;
    x: number;
    y: number;
    delay: number;
    duration: number;
  }>;
}

export default function FloatingBackground({ backgroundElements }: FloatingBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated Background Blobs */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-purple-400/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, delay: 4 }}
      />
      
      {/* Floating icons */}
      {backgroundElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute text-2xl opacity-10"
          style={{ left: `${element.x}%`, top: `${element.y}%` }}
          animate={{
            y: [-20, 20, -20],
            rotate: [-10, 10, -10],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            delay: element.delay,
            ease: "easeInOut",
          }}
        >
          {element.icon}
        </motion.div>
      ))}
    </div>
  );
}