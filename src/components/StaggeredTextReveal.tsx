import React from 'react';
import { motion } from 'motion/react';

interface StaggeredTextRevealProps {
  text: string;
  className?: string;
  wordClassName?: string;
  shimmerWords?: string[];
  delay?: number;
  staggerDelay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const StaggeredTextReveal: React.FC<StaggeredTextRevealProps> = ({
  text,
  className = '',
  wordClassName = '',
  shimmerWords = [],
  delay = 0,
  staggerDelay = 0.06,
  as: Component = 'div',
}) => {
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: 18,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring' as const,
        damping: 18,
        stiffness: 95,
        mass: 0.65,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap items-center gap-x-[0.25em] gap-y-[0.1em] ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ perspective: 1000 }}
    >
      {words.map((word, idx) => {
        // Strip out trailing punctuation for shimmer comparison
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toUpperCase();
        const isShimmer = shimmerWords.some(
          (sw) => sw.toUpperCase() === cleanWord
        );

        return (
          <motion.span
            key={`${word}-${idx}`}
            variants={wordVariants}
            className={`inline-block whitespace-nowrap will-change-transform ${
              isShimmer ? 'text-gold-shimmer font-bold' : ''
            } ${wordClassName}`}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
};
