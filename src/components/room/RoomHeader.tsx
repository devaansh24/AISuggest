// src/components/room/RoomHeader.tsx
import { motion } from "framer-motion";
import { Lightbulb, Sparkles, Users, Share2, Copy, Check } from "lucide-react";

interface Idea {
  id: string;
  session_id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  created_at: string;
}

interface Participant {
  user_id: string;
  user_name: string;
  cursor_x: number;
  cursor_y: number;
  color: string;
  last_seen: string;
  hovering_idea_id?: string | null;
}

interface RoomHeaderProps {
  session: {
    title?: string;
  } | null;
  ideas: Idea[]; // Fixed: replaced 'any[]' with proper type
  otherParticipants: Participant[]; // Fixed: replaced 'any[]' with proper type
  sessionId: string | null;
  copied: boolean;
  myUserName: string;
  myColor: string;
  onCopyRoomId: () => void;
}

export default function RoomHeader({
  session,
  ideas,
  otherParticipants,
  sessionId,
  copied,
  myUserName,
  myColor,
  onCopyRoomId,
}: RoomHeaderProps) {
  return (
    <>
      {/* Main Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 lg:top-6 lg:left-6 bg-white/10 backdrop-blur-xl p-3 lg:p-4 rounded-2xl shadow-2xl z-10 border border-white/20"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div>
            <h1 className="font-bold text-lg text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-300" />
              {session?.title || "Brainstorming Room"}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {ideas.length} ideas
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {otherParticipants.length + 1} creators
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Room ID and Invite Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 right-4 lg:top-6 lg:right-6 bg-white/10 backdrop-blur-xl p-3 lg:p-4 rounded-2xl shadow-2xl z-10 border border-white/20"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-white/80" />
            <span className="text-sm font-medium text-white">Invite Creators</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/20">
            <code className="text-sm text-white/90 flex-1 font-mono">
              {sessionId?.slice(0, 8)}...
            </code>
            <motion.button
              onClick={onCopyRoomId}
              className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-3 py-1 rounded-xl text-xs font-medium transition-all duration-300 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy"}
            </motion.button>
          </div>
          <p className="text-xs text-white/60">Share this Room ID to collaborate</p>
        </div>
      </motion.div>

      {/* User Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl p-2 px-4 rounded-xl shadow-2xl z-10 border border-white/20"
      >
        <div className="flex items-center gap-2 text-sm text-white">
          <motion.div 
            className="w-3 h-3 rounded-full border-2 border-white/50" 
            style={{ backgroundColor: myColor }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <span>Welcome, <span className="font-medium">{myUserName}</span> ✨</span>
        </div>
      </motion.div>
    </>
  );
}