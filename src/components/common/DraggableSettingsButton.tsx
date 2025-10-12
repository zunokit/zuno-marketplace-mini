"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { logger } from "@/lib/utils/logger";

interface DraggableSettingsButtonProps {
  onClick: () => void;
}

const STORAGE_KEY = "draggable-settings-position";

export function DraggableSettingsButton({
  onClick,
}: DraggableSettingsButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved position from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedPosition = localStorage.getItem(STORAGE_KEY);
      if (savedPosition) {
        const { x, y } = JSON.parse(savedPosition);
        // Validate position is within viewport
        const maxX = window.innerWidth - 48;
        const maxY = window.innerHeight - 48;
        const validPosition = {
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        };
        setPosition(validPosition);
        logger.info(
          "Loaded saved position for draggable settings button",
          validPosition,
          {
            component: "DraggableSettingsButton",
            action: "loadPosition",
          }
        );
      } else {
        // Default position: bottom-right corner (like Next.js dev button)
        const defaultPosition = {
          x: window.innerWidth - 80, // 48px button + 32px margin
          y: window.innerHeight - 80,
        };
        setPosition(defaultPosition);
        logger.info(
          "Using default position for draggable settings button",
          defaultPosition,
          {
            component: "DraggableSettingsButton",
            action: "setDefaultPosition",
          }
        );
      }
    } catch (error) {
      logger.error("Failed to load saved position", error, {
        component: "DraggableSettingsButton",
        action: "loadPosition",
      });
      // Fallback to safe default position
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      });
    }
  }, [isClient]);

  // Save position to localStorage when dragging ends
  const handleDragEnd = (event: any, info: any) => {
    const newPosition = { x: info.point.x, y: info.point.y };
    setPosition(newPosition);
    setIsDragging(false);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosition));
      logger.info("Saved draggable settings button position", newPosition, {
        component: "DraggableSettingsButton",
        action: "savePosition",
      });
    } catch (error) {
      logger.error("Failed to save position", error, {
        component: "DraggableSettingsButton",
        action: "savePosition",
      });
    }
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

  // Force position to be visible - reset to bottom-right if position is invalid
  const safePosition = (() => {
    const maxX = window.innerWidth - 68;
    const maxY = window.innerHeight - 68;

    // If position is outside viewport, reset to bottom-right
    if (
      position.x > maxX ||
      position.y > maxY ||
      position.x < 0 ||
      position.y < 0
    ) {
      return { x: maxX, y: maxY };
    }

    return {
      x: Math.max(20, Math.min(position.x, maxX)),
      y: Math.max(20, Math.min(position.y, maxY)),
    };
  })();

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: 0,
        right: window.innerWidth - 48,
        top: 0,
        bottom: window.innerHeight - 48,
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ x: safePosition.x, y: safePosition.y }}
      animate={{
        x: safePosition.x,
        y: safePosition.y,
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
