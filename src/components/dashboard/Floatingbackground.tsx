
interface FloatingElement {
  id: number;
  icon: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function FloatingBackground() {
const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const elements = [
      { id: 1, icon: "💡", x: 5, y: 10, delay: 0, duration: 6 },
      { id: 2, icon: "🚀", x: 90, y: 15, delay: 1, duration: 8 },
      { id: 3, icon: "✨", x: 15, y: 85, delay: 2, duration: 7 },
      { id: 4, icon: "🎯", x: 85, y: 80, delay: 3, duration: 9 },
      { id: 5, icon: "🌟", x: 50, y: 5, delay: 4, duration: 6 },
      { id: 6, icon: "💫", x: 10, y: 50, delay: 5, duration: 8 },
      { id: 7, icon: "🔥", x: 95, y: 50, delay: 6, duration: 7 },
    ];
    setFloatingElements(elements);
  }, []);

  return (
    <>
      {/* Floating Elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute text-2xl opacity-10 pointer-events-none z-0"
          style={{ left: `${element.x}%`, top: `${element.y}%` }}
          animate={{
            y: [-15, 15, -15],
            x: [-10, 10, -10],
            rotate: [-5, 5, -5],
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

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 5 }}
        />
      </div>
    </>
  );
}