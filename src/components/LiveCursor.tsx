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

  // Hide cursor if participant hasn't been active for too long
  useEffect(() => {
    const lastSeenTime = new Date(participant.last_seen).getTime();
    const now = new Date().getTime();
    const timeSinceLastSeen = now - lastSeenTime;
    
    // Hide cursor if participant was last seen more than 30 seconds ago
    if (timeSinceLastSeen > 30000) { // 30 seconds
      setIsVisible(false);
    } else {
      setIsVisible(true);
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
          opacity: 1 
        }}
        exit={{ 
          scale: 0, 
          opacity: 0,
          transition: { duration: 0.2 }
        }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 400,
          mass: 0.5
        }}
      >
        {/* Cursor pointer */}
        <motion.div
          className="relative"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-lg filter"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
              fill={participant.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* User name label */}
          <motion.div
            className="absolute top-5 left-4 px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg whitespace-nowrap"
            style={{ backgroundColor: participant.color }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {participant.user_name}
          </motion.div>

          {/* Activity indicator dot */}
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: participant.color }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Hover indicator when hovering over an idea */}
          {participant.hovering_idea_id && (
            <motion.div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-blue-500 text-white text-xs rounded shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              Viewing idea
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}