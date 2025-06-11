import { motion } from "framer-motion";
import { Rocket, Zap, UserPlus } from "lucide-react";

interface EmptyRoomsStateProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  isCreatingRoom: boolean;
}

export default function EmptyRoomsState({ 
  onCreateRoom, 
  onJoinRoom, 
  isCreatingRoom 
}: EmptyRoomsStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="col-span-full"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 text-center">
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl mb-6 shadow-lg"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Rocket className="w-12 h-12 text-white" />
        </motion.div>
        
        <h3 className="text-2xl font-bold text-white mb-3">Ready to Launch Ideas? 🚀</h3>
        <p className="text-white/70 mb-8 text-lg">Your creative journey starts here. Create your first room and watch magic happen!</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={onCreateRoom}
            disabled={isCreatingRoom}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCreatingRoom ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Creating Magic...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Create Your First Room
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={onJoinRoom}
            className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserPlus className="w-5 h-5" />
            Join Existing Room
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}