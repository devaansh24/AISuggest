import { motion } from "framer-motion";

interface Participant {
  user_id: string;
  user_name: string;
  cursor_x: number;
  cursor_y: number;
  color: string;
}

interface LiveCursorProps {
  participant: Participant;
}

export default function LiveCursor({ participant }: LiveCursorProps) {
  return (
    <motion.div
      className="absolute pointer-events-none z-50 transition-transform duration-100 ease-linear"
      style={{
        left: `${participant.cursor_x}px`,
        top: `${participant.cursor_y}px`,
        color: participant.color,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-lg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      <div
        className="ml-4 -mt-1 px-2 py-1 rounded text-xs font-medium text-white shadow-lg"
        style={{ backgroundColor: participant.color }}
      >
        {participant.user_name}
      </div>
    </motion.div>
  );
}