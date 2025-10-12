import { useState, useEffect } from "react";
import { logger } from "@/lib/utils/logger";

interface Position {
  x: number;
  y: number;
}

interface UseDraggablePositionOptions {
  storageKey: string;
  defaultPosition?: Position;
  buttonSize?: number;
  margin?: number;
}

export function useDraggablePosition({
  storageKey,
  defaultPosition,
  buttonSize = 48,
  margin = 24,
}: UseDraggablePositionOptions) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate default position (bottom-right corner)
  const getDefaultPosition = (): Position => {
    if (defaultPosition) return defaultPosition;

    return {
      x: window.innerWidth - buttonSize - margin,
      y: window.innerHeight - buttonSize - margin,
    };
  };

  // Calculate safe position with proper constraints
  const getSafePosition = (pos: Position): Position => {
    const maxX = window.innerWidth - buttonSize - margin;
    const maxY = window.innerHeight - buttonSize - margin;

    return {
      x: Math.max(margin, Math.min(pos.x, maxX)),
      y: Math.max(margin, Math.min(pos.y, maxY)),
    };
  };

  // Load saved position or use default
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedPosition = localStorage.getItem(storageKey);
      if (savedPosition) {
        const { x, y } = JSON.parse(savedPosition);
        const validPosition = getSafePosition({ x, y });
        setPosition(validPosition);
        logger.info(
          "Loaded saved position for draggable element",
          validPosition,
          {
            component: "useDraggablePosition",
            action: "loadPosition",
          }
        );
      } else {
        const defaultPos = getDefaultPosition();
        setPosition(defaultPos);
        logger.info(
          "Using default position for draggable element",
          defaultPos,
          {
            component: "useDraggablePosition",
            action: "setDefaultPosition",
          }
        );
      }
    } catch (error) {
      logger.error("Failed to load saved position", error, {
        component: "useDraggablePosition",
        action: "loadPosition",
      });
      setPosition(getDefaultPosition());
    }
  }, [isClient, storageKey, buttonSize, margin]);

  // Handle window resize to keep element in viewport
  useEffect(() => {
    if (!isClient) return;

    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const maxX = window.innerWidth - buttonSize - margin;
        const maxY = window.innerHeight - buttonSize - margin;

        // Check if current position is outside new viewport
        const currentX = position.x;
        const currentY = position.y;

        let newX = currentX;
        let newY = currentY;

        // Adjust position if outside viewport
        if (currentX > maxX) newX = maxX;
        if (currentY > maxY) newY = maxY;
        if (currentX < margin) newX = margin;
        if (currentY < margin) newY = margin;

        // Only update if position changed
        if (newX !== currentX || newY !== currentY) {
          const newPosition = { x: newX, y: newY };
          setPosition(newPosition);

          // Save new position
          try {
            localStorage.setItem(storageKey, JSON.stringify(newPosition));
            logger.info("Adjusted position after window resize", newPosition, {
              component: "useDraggablePosition",
              action: "resizeAdjustment",
            });
          } catch (error) {
            logger.error("Failed to save position after resize", error, {
              component: "useDraggablePosition",
              action: "resizeAdjustment",
            });
          }
        }
      }, 100); // 100ms debounce
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [isClient, position.x, position.y, storageKey, buttonSize, margin]);

  // Save position to localStorage
  const savePosition = (newPosition: Position) => {
    const safePosition = getSafePosition(newPosition);
    setPosition(safePosition);

    try {
      localStorage.setItem(storageKey, JSON.stringify(safePosition));
      logger.info("Saved draggable element position", safePosition, {
        component: "useDraggablePosition",
        action: "savePosition",
      });
    } catch (error) {
      logger.error("Failed to save position", error, {
        component: "useDraggablePosition",
        action: "savePosition",
      });
    }
  };

  // Get drag constraints
  const getDragConstraints = () => ({
    left: margin,
    right: Math.max(margin, window.innerWidth - buttonSize - margin),
    top: margin,
    bottom: Math.max(margin, window.innerHeight - buttonSize - margin),
  });

  return {
    position,
    isClient,
    savePosition,
    getDragConstraints,
    getSafePosition,
  };
}
