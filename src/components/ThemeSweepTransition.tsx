import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ThemeSweepTransitionProps {
  isDark: boolean;
}

export const ThemeSweepTransition: React.FC<ThemeSweepTransitionProps> = ({ isDark }) => {
  const [sweepKey, setSweepKey] = useState(0);
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }
    setSweepKey((prev) => prev + 1);
  }, [isDark]);

  if (isFirstMount) return null;

  return (
    <AnimatePresence>
      {sweepKey > 0 && (
        <motion.div
          key={sweepKey}
          initial={{ opacity: 0.85, x: '-100%' }}
          animate={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Radiant gold light sweep beam across viewport */}
          <div
            className="w-full h-full"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.12) 40%, rgba(243, 229, 171, 0.28) 50%, rgba(212, 175, 55, 0.12) 60%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(184, 134, 11, 0.15) 40%, rgba(255, 255, 255, 0.45) 50%, rgba(184, 134, 11, 0.15) 60%, transparent 100%)',
              filter: 'blur(20px)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
