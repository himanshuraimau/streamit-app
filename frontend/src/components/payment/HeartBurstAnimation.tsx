import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  delay: number;
}

interface HeartBurstAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
  particleCount?: number;
}

/**
 * HeartBurstAnimation Component
 * 
 * Displays floating hearts animation when triggered.
 * Used for penny tip success feedback.
 * 
 * Requirements: 3.2 - Heart burst animation on like button tap
 */
export function HeartBurstAnimation({
  isActive,
  onComplete,
  particleCount = 8,
}: HeartBurstAnimationProps) {
  const [particles, setParticles] = useState<HeartParticle[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate random particles
      const newParticles: HeartParticle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 120, // Random horizontal spread
        y: -(Math.random() * 80 + 40), // Float upward
        scale: 0.5 + Math.random() * 0.8, // Random size
        rotation: (Math.random() - 0.5) * 60, // Random rotation
        delay: Math.random() * 0.2, // Staggered start
      }));
      
      setParticles(newParticles);

      // Clear particles and call onComplete after animation
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isActive, particleCount, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 0,
              rotate: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              x: particle.x,
              y: particle.y,
              scale: [0, particle.scale, particle.scale * 0.8],
              rotate: particle.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1,
              delay: particle.delay,
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for natural float
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Heart
              className="text-red-500 fill-red-500 drop-shadow-lg"
              style={{
                width: `${20 * particle.scale}px`,
                height: `${20 * particle.scale}px`,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Standalone heart burst that can be triggered imperatively
 */
export function useHeartBurst() {
  const [isActive, setIsActive] = useState(false);

  const trigger = () => {
    setIsActive(true);
  };

  const reset = () => {
    setIsActive(false);
  };

  return { isActive, trigger, reset };
}
