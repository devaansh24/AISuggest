// components/room/ArrangementPanel.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Circle,
  Shuffle,
  Move,
  ChevronDown
} from "lucide-react";

interface Idea {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
}

interface ArrangementPanelProps {
  ideas: Idea[];
  onArrangeIdeas: (arrangedIdeas: { id: string; x: number; y: number }[]) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export default function ArrangementPanel({ 
  ideas, 
  onArrangeIdeas,
  canvasWidth = 1200,
  canvasHeight = 800 
}: ArrangementPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isArranging, setIsArranging] = useState(false);

  const executeArrangement = async (arrangementFn: () => { id: string; x: number; y: number }[]) => {
    if (ideas.length === 0) return;
    
    setIsArranging(true);
    try {
      const arrangedPositions = arrangementFn();
      await onArrangeIdeas(arrangedPositions);
    } catch (error) {
      console.error("Error arranging ideas:", error);
    } finally {
      setTimeout(() => setIsArranging(false), 500);
    }
  };

  // Arrangement algorithms
  const arrangements = {
    // 4x4 Grid - Left Aligned
    gridLeftAlign: () => {
      const cols = 4;
      const startX = 100; // Left padding
      const startY = 200; // Top padding
      const spacingX = 220; // Space between columns
      const spacingY = 180; // Space between rows
      
      return ideas.slice(0, 16).map((idea, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
          id: idea.id,
          x: startX + (col * spacingX),
          y: startY + (row * spacingY)
        };
      });
    },

    // 4x4 Grid - Center Aligned
    gridCenterAlign: () => {
      const cols = 4;
      const cardWidth = 200;
      const spacingX = 220;
      const spacingY = 180;
      
      // Calculate total grid width and center it
      const totalGridWidth = (cols - 1) * spacingX + cardWidth;
      const startX = (canvasWidth - totalGridWidth) / 2;
      const startY = 200;
      
      return ideas.slice(0, 16).map((idea, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
          id: idea.id,
          x: startX + (col * spacingX),
          y: startY + (row * spacingY)
        };
      });
    },

    // 4x4 Grid - Right Aligned
    gridRightAlign: () => {
      const cols = 4;
      const cardWidth = 200;
      const spacingX = 220;
      const spacingY = 180;
      const rightPadding = 100;
      
      // Calculate starting position from the right
      const totalGridWidth = (cols - 1) * spacingX + cardWidth;
      const startX = canvasWidth - totalGridWidth - rightPadding;
      const startY = 200;
      
      return ideas.slice(0, 16).map((idea, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
          id: idea.id,
          x: startX + (col * spacingX),
          y: startY + (row * spacingY)
        };
      });
    },

    // Circular arrangement
    circleLayout: () => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(canvasWidth, canvasHeight) / 3;
      const angleStep = (2 * Math.PI) / ideas.length;
      
      return ideas.map((idea, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        return {
          id: idea.id,
          x: centerX + Math.cos(angle) * radius - 100, // 100 is half card width
          y: centerY + Math.sin(angle) * radius - 80   // 80 is half card height
        };
      });
    },

    // Random scatter
    randomScatter: () => {
      const padding = 150;
      const cardWidth = 200;
      const cardHeight = 160;
      
      return ideas.map((idea) => ({
        id: idea.id,
        x: padding + Math.random() * (canvasWidth - 2 * padding - cardWidth),
        y: 200 + Math.random() * (canvasHeight - 400 - cardHeight) // Leave space for header/footer
      }));
    }
  };

  const arrangementButtons = [
    {
      name: "Grid Left",
      icon: AlignLeft,
      action: arrangements.gridLeftAlign,
      description: "4×4 grid aligned to the left"
    },
    {
      name: "Grid Center", 
      icon: AlignCenter,
      action: arrangements.gridCenterAlign,
      description: "4×4 grid centered on canvas"
    },
    {
      name: "Grid Right",
      icon: AlignRight,
      action: arrangements.gridRightAlign,
      description: "4×4 grid aligned to the right"
    },
    {
      name: "Circle",
      icon: Circle,
      action: arrangements.circleLayout,
      description: "Arrange all ideas in a circle"
    },
    {
      name: "Scatter",
      icon: Shuffle,
      action: arrangements.randomScatter,
      description: "Randomly scatter ideas across canvas"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-4 top-1/2 transform -translate-y-1/2 z-20"
    >
      <motion.div
        className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
        animate={{ 
          width: isExpanded ? 300 : 60,
          height: isExpanded ? "auto" : 60 
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-15 flex items-center justify-center text-white hover:bg-white/10 transition-colors p-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Move className="w-6 h-6" />
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 font-medium text-lg"
            >
              Arrange Ideas
            </motion.span>
          )}
          <motion.div
            className="ml-auto"
            animate={{ rotate: isExpanded ? 180 : 0 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.button>

        {/* Arrangement Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {ideas.length === 0 ? (
                <div className="text-center text-white/60 text-sm py-8">
                  <Move className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No Ideas Yet</p>
                  <p>Add some ideas to start arranging!</p>
                </div>
              ) : (
                <>
                  <div className="text-white/80 text-base mb-6 text-center">
                    <span className="font-semibold text-yellow-300">{ideas.length}</span> ideas ready to arrange
                  </div>
                  
                  <div className="space-y-3">
                    {arrangementButtons.map((arrangement, index) => (
                      <motion.button
                        key={arrangement.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => executeArrangement(arrangement.action)}
                        disabled={isArranging}
                        className="w-full flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/15 transition-all duration-200 text-white/80 hover:text-white border border-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        title={arrangement.description}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 mr-4 group-hover:bg-white/20 transition-colors">
                          {isArranging ? (
                            <motion.div
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          ) : (
                            <arrangement.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="font-medium text-base">{arrangement.name}</div>
                          <div className="text-xs text-white/60 mt-1">{arrangement.description}</div>
                        </div>

                        {/* Special badge for grid layouts */}
                        {arrangement.name.includes('Grid') && (
                          <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                            4×4
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="text-center">
                      <div className="text-yellow-300 text-sm font-medium mb-2">💡 Pro Tip</div>
                      <div className="text-xs text-white/70">
                        Use grid layouts for organized presentation, circle for brainstorming, 
                        and scatter for creative chaos!
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}