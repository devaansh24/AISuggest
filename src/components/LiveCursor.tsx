import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Participant {
  user_id: string;
  user_name: string;
  cursor_x: number;
  cursor_y: number;
  color: string;
  last_seen: string;
  hovering_idea_id?: string | null;
}

interface LiveCursorProps {
  participant: Participant;
}

export default function LiveCursor({ participant }: LiveCursorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastPosition, setLastPosition] = useState({ x: participant.cursor_x, y: participant.cursor_y });
  const [isActive, setIsActive] = useState(true);

  // Hide cursor if participant hasn't been active for too long
  useEffect(() => {
    const lastSeenTime = new Date(participant.last_seen).getTime();
    const now = new Date().getTime();
    const timeSinceLastSeen = now - lastSeenTime;
    
    // Hide cursor if participant was last seen more than 30 seconds ago
    if (timeSinceLastSeen > 30000) { // 30 seconds
      setIsVisible(false);
      setIsActive(false);
    } else {
      setIsVisible(true);
      setIsActive(timeSinceLastSeen < 5000); // Consider active if seen within 5 seconds
    }
  }, [participant.last_seen]);

  // Update position tracking
  useEffect(() => {
    setLastPosition({ x: participant.cursor_x, y: participant.cursor_y });
  }, [participant.cursor_x, participant.cursor_y]);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="absolute pointer-events-none z-50"
        style={{
          left: 0,
          top: 0,
        }}
        initial={{ 
          x: lastPosition.x, 
          y: lastPosition.y,
          scale: 0, 
          opacity: 0 
        }}
        animate={{ 
          x: participant.cursor_x, 
          y: participant.cursor_y,
          scale: 1, 
          opacity: isActive ? 1 : 0.6
        }}
        exit={{ 
          scale: 0, 
          opacity: 0,
          transition: { duration: 0.3 }
        }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 400,
          mass: 0.5
        }}
      >
        {/* Cursor pointer with enhanced visibility */}
        <motion.div
          className="relative"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* Cursor glow effect */}
          <motion.div
            className="absolute -inset-2 rounded-full opacity-30 blur-sm"
            style={{ backgroundColor: participant.color }}
            animate={{ 
              scale: isActive ? [1, 1.2, 1] : 1,
              opacity: isActive ? [0.3, 0.6, 0.3] : 0.2
            }}
            transition={{ 
              duration: 2, 
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
          
          {/* Main cursor */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-xl filter relative z-10"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
          >
            <path
              d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
              fill={participant.color}
              stroke="white"
              strokeWidth="2"
            />
          </svg>

          {/* User name label with enhanced styling */}
          <motion.div
            className="absolute top-6 left-6 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xl whitespace-nowrap border border-white/20 backdrop-blur-sm"
            style={{ 
              backgroundColor: participant.color,
              boxShadow: `0 8px 32px ${participant.color}40`
            }}
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-1">
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{ 
                  scale: isActive ? [1, 1.5, 1] : 1,
                  opacity: isActive ? [0.8, 1, 0.8] : 0.5
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />
              {participant.user_name}
            </div>
          </motion.div>

          {/* Activity pulse indicator */}
          <motion.div
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: participant.color }}
            animate={{ 
              scale: isActive ? [1, 1.3, 1] : [1, 1.1, 1],
              opacity: isActive ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4]
            }}
            transition={{ 
              duration: isActive ? 1.5 : 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Hover indicator when hovering over an idea */}
          {participant.hovering_idea_id && (
            <motion.div
              className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg shadow-lg border border-white/20 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
            >
              <div className="flex items-center gap-1">
                <span>👀</span>
                <span>Viewing idea</span>
              </div>
              {/* Arrow pointing down */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-blue-600"></div>
            </motion.div>
          )}

          {/* Trail effect for movement */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-20"
            style={{ backgroundColor: participant.color }}
            animate={{
              scale: [0, 2],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              repeat: 0,
            }}
            key={`${participant.cursor_x}-${participant.cursor_y}`}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}