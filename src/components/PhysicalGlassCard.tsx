import React, { useRef, useState } from 'react';

export type GlassThemeStyle = 'crystal' | 'gold' | 'obsidian';

interface PhysicalGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glassStyle?: GlassThemeStyle;
  dark?: boolean;
  dataCursor?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

/**
 * PhysicalGlassCard Component (sanjay_s_lightworks_ultra_glassmorphism)
 * Features:
 * - Real-time 3D tilt calculation based on cursor coordinates
 * - Specular cursor radial glint following user movement
 * - Expanding liquid glass ripples on interaction
 * - Frosted crystal, liquid gold, and obsidian glass shaders
 * - Continuous diagonal sheen beam and refraction bevel
 */
export const PhysicalGlassCard: React.FC<PhysicalGlassCardProps> = ({
  children,
  className = '',
  glassStyle = 'crystal',
  dark = false,
  dataCursor,
  onClick,
  style = {},
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number }>({ rotateX: 0, rotateY: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate 3D tilt angles (max +/- 8deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTilt({ rotateX, rotateY });
    setCursorPos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 1.2;

      const newRipple: Ripple = { x, y, size, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 650);
    }

    if (onClick) onClick(e);
  };

  const getThemeClass = () => {
    if (dark) return 'glass-theme-obsidian';
    if (glassStyle === 'gold') return 'glass-theme-gold';
    if (glassStyle === 'obsidian') return 'glass-theme-obsidian';
    return 'glass-theme-crystal';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      data-cursor={dataCursor}
      className={`relative rounded-3xl transition-transform duration-200 ease-out shimmer-glass glass-bevel overflow-hidden cursor-pointer ${getThemeClass()} ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${
          isHovered ? 1.015 : 1
        }, ${isHovered ? 1.015 : 1}, 1)`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...props}
    >
      {/* Real-time Cursor Specular Light Glint */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 240px at ${cursorPos.x}px ${cursorPos.y}px, rgba(255, 255, 255, 0.45), rgba(212, 175, 55, 0.25) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Liquid Glass Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="glass-ripple"
          style={{
            top: r.y - r.size / 2,
            left: r.x - r.size / 2,
            width: r.size,
            height: r.size,
          }}
        />
      ))}

      {/* Card Content Container */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
