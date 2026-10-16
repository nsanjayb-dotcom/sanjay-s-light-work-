import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { soundEngine } from '../utils/audio';

interface Magnetic3DButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'gold' | 'outline' | 'ghost';
  isDark?: boolean;
  className?: string;
  dataCursor?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  strength?: number;
}

export const Magnetic3DButton: React.FC<Magnetic3DButtonProps> = ({
  children,
  variant = 'gold',
  isDark = true,
  className = '',
  dataCursor = 'pointer',
  onClick,
  strength = 0.35,
  ...rest
}) => {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Springs for magnetic translation & 3D tilt
  const springConfig = { damping: 16, stiffness: 220, mass: 0.6 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  // 3D rotation derived from mouse offsets
  const rotateX = useTransform(mouseY, [-30, 30], [8, -8]);
  const rotateY = useTransform(mouseX, [-30, 30], [-8, 8]);

  // Specular light reflection coordinates
  const [reflectionPos, setReflectionPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relX = (e.clientX - centerX) * strength;
    const relY = (e.clientY - centerY) * strength;

    mouseX.set(relX);
    mouseY.set(relY);

    // Percentage for specular light
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setReflectionPos({ x: xPct, y: yPct });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    soundEngine.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const hasTriggeredRef = useRef(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    hasTriggeredRef.current = true;
    soundEngine.playClick();
    soundEngine.triggerHaptic(20);
    if (onClick) onClick(e);
    setTimeout(() => {
      hasTriggeredRef.current = false;
    }, 120);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Guarantees immediate single-click response even if Framer-motion pans
    if (!hasTriggeredRef.current && e.button === 0) {
      hasTriggeredRef.current = true;
      soundEngine.playClick();
      soundEngine.triggerHaptic(20);
      if (onClick) onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
      setTimeout(() => {
        hasTriggeredRef.current = false;
      }, 120);
    }
  };

  // Base styling variants
  let variantStyles = '';
  if (variant === 'gold') {
    variantStyles =
      'btn-tactile-gold text-[#12110E] shadow-[0_4px_22px_rgba(232,196,90,0.4)] hover:shadow-[0_8px_36px_rgba(250,235,186,0.7)] border-white/60';
  } else if (variant === 'outline') {
    variantStyles = isDark
      ? 'bg-[#18181F]/90 text-white border-[#E8C45A]/40 hover:border-[#FFF0C8] hover:bg-[#22222B] shadow-[0_4px_18px_rgba(0,0,0,0.45)] hover:shadow-[0_0_24px_rgba(232,196,90,0.3)]'
      : 'bg-white text-[#141312] border-[#E8C45A]/50 hover:border-[#CCA43B] hover:bg-[#FAF8F5] shadow-sm hover:shadow-[0_0_20px_rgba(232,196,90,0.25)]';
  } else {
    variantStyles = isDark
      ? 'bg-transparent text-white/80 hover:text-white border-transparent'
      : 'bg-transparent text-[#141312]/80 hover:text-[#141312] border-transparent';
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      style={{
        x: mouseX,
        y: mouseY,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onPointerUp={handlePointerUp}
      data-cursor={dataCursor}
      className={`relative inline-flex items-center justify-center select-none overflow-hidden rounded-sm transition-all duration-300 active:scale-[0.96] cursor-pointer ${variantStyles} ${className}`}
      {...rest}
    >
      {/* Dynamic Specular Sheen layer that tracks cursor */}
      {isHovered && (
        <span
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-sm"
          style={{
            backgroundImage: `radial-gradient(circle 90px at ${reflectionPos.x}% ${reflectionPos.y}%, rgba(255, 255, 255, ${
              variant === 'gold' ? 0.75 : 0.35
            }), transparent 100%)`,
          }}
        />
      )}

      {/* Button content with subtle forward Z-projection */}
      <span className="relative z-10 flex items-center justify-center gap-2 pointer-events-none" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </span>
    </motion.button>
  );
};
