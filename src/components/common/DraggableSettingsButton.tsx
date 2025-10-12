"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { logger } from "@/lib/utils/logger";
import { useDraggablePosition } from "@/hooks/use-draggable-position";

interface DraggableSettingsButtonProps {
  onClick: () => void;
}

const STORAGE_KEY = "draggable-settings-position";

export function DraggableSettingsButton({
  onClick,
}: DraggableSettingsButtonProps) {
  const [isDragging, setIsDragging] = useState(false);

  const { position, isClient, savePosition, getDragConstraints } =
    useDraggablePosition({
      storageKey: STORAGE_KEY,
      buttonSize: 48,
      margin: 24,
    });

  // Save position when dragging ends
  const handleDragEnd = (event: any, info: any) => {
    const newPosition = { x: info.point.x, y: info.point.y };
    savePosition(newPosition);
    setIsDragging(false);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    logger.debug(
      "Started dragging settings button",
      {},
      {
        component: "DraggableSettingsButton",
        action: "dragStart",
      }
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if we're not dragging
    if (!isDragging) {
      onClick();
      logger.info(
        "Settings button clicked",
        {},
        {
          component: "DraggableSettingsButton",
          action: "click",
        }
      );
    }
  };

  // Don't render on server side
  if (!isClient) {
    return null;
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={getDragConstraints()}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ x: position.x, y: position.y }}
      animate={{
        x: position.x,
        y: position.y,
        scale: isDragging ? 1.1 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed z-50 cursor-grab active:cursor-grabbing"
      style={{
        left: 0,
        top: 0,
        pointerEvents: "auto",
      }}
    >
      <Button
        onClick={handleClick}
        size="icon"
        className={`h-12 w-12 rounded-full shadow-lg transition-all duration-200 ${
          isDragging
            ? "shadow-2xl ring-2 ring-primary/20 bg-primary/90"
            : "hover:shadow-xl hover:bg-primary/80"
        }`}
        aria-label="Configure Environment"
        title="Configure Environment Variables (Drag to move)"
        style={{
          pointerEvents: "auto",
        }}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </motion.div>
  );
}
