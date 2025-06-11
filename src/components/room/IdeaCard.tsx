import { motion } from "framer-motion";
import { useState } from "react";

interface IdeaCardProps {
  idea: {
    id: string;
    content: string;
    x: number;
    y: number;
    color: string;
  };
  editingId: string | null;
  isBeingHovered: boolean;
  hoverParticipants: Array<{
    user_id: string;
    user_name: string;
    color: string;
  }>;
  onEdit: (id: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function IdeaCard({
  idea,
  editingId,
  isBeingHovered,
  hoverParticipants,
  onEdit,
  onUpdateContent,
  onUpdatePosition,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: IdeaCardProps) {
  return (
    <motion.div
      key={idea.id}
      className="absolute cursor-move group"
      style={{ left: `${idea.x}px`, top: `${idea.y}px` }}
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
      drag
      dragMomentum={false}
      onDragStart={() => onDragStart()}
      onDragEnd={(e, info) => {
        onDragEnd();
        const newX = Math.max(0, idea.x + info.offset.x);
        const newY = Math.max(0, idea.y + info.offset.y);
        onUpdatePosition(idea.id, newX, newY);
      }}
      onMouseEnter={() => onMouseEnter(idea.id)}
      onMouseLeave={onMouseLeave}
      whileHover={{ 
        scale: 1.05, 
        rotate: 2,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      whileDrag={{ 
        scale: 1.1, 
        rotate: 5, 
        zIndex: 1000,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
      }}
      onClick={(e) => e.stopPropagation()}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className={`w-40 h-32 lg:w-48 lg:h-36 p-4 rounded-2xl shadow-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
          isBeingHovered 
            ? 'border-white/60 shadow-2xl ring-4 ring-white/20' 
            : 'border-white/30'
        }`}
        style={{ 
          backgroundColor: idea.color,
          boxShadow: isBeingHovered 
            ? `0 20px 40px -12px ${idea.color}40, 0 0 0 1px rgba(255,255,255,0.1)` 
            : `0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)`
        }}
      >
        {editingId === idea.id ? (
          <textarea
            defaultValue={idea.content}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm lg:text-base font-medium text-gray-800 placeholder-gray-600"
            autoFocus
            onBlur={(e) => onUpdateContent(idea.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onUpdateContent(idea.id, e.currentTarget.value);
              }
            }}
            placeholder="✨ Your brilliant idea..."
          />
        ) : (
          <div
            onDoubleClick={() => onEdit(idea.id)}
            className="w-full h-full text-sm lg:text-base font-medium text-gray-800 overflow-hidden cursor-text leading-relaxed"
          >
            {idea.content}
          </div>
        )}

        <motion.button
          onClick={() => onDelete(idea.id)}
          className="absolute -top-3 -right-3 bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white rounded-full w-7 h-7 text-lg font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          ×
        </motion.button>

        {/* Collaboration indicators */}
        {isBeingHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 left-0 flex gap-1 flex-wrap max-w-48"
          >
            {hoverParticipants.map((participant) => (
              <motion.div
                key={participant.user_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-2 py-1 text-xs font-medium text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20"
                style={{ backgroundColor: `${participant.color}90` }}
              >
                👀 {participant.user_name}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Idea sparkle effect */}
        <motion.div
          className="absolute -top-1 -right-1 text-yellow-300"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ✨
        </motion.div>
      </div>
    </motion.div>
  );
}