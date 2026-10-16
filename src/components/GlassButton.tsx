import React, { useRef, useState } from 'react';

export type GlassButtonVariant = 'primary' | 'secondary' | 'dark';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: GlassButtonVariant;
  dataCursor?: string;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

/**
 * GlassButton Component (sanjay_s_lightworks_ultra_glassmorphism)
 * Tactile hyper-realistic glass button with 3D tilt, specular glint,
 * liquid ripple physics, shimmer sheen beam, and bevel highlight.
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  dataCursor,
  onClick,
  style = {},
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number }>({ rotateX: 0, rotateY: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTilt({ rotateX, rotateY });
    setCursorPos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 1.5;

      const newRipple: Ripple = { x, y, size, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 650);
    }

    if (onClick) onClick(e);
  };

  const getVariantStyle = () => {
    if (variant === 'secondary') return 'glass-btn-secondary';
    if (variant === 'dark') return 'glass-btn-dark';
    return 'glass-btn-primary';
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      data-cursor={dataCursor}
      className={`relative inline-flex items-center justify-center font-bold tracking-[0.18em] uppercase rounded-xl transition-all duration-200 ease-out shimmer-glass glass-bevel overflow-hidden cursor-pointer ${getVariantStyle()} ${className}`}
      style={{
        transform: `perspective(600px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${
          isHovered ? 1.04 : 1
        }, ${isHovered ? 1.04 : 1}, 1)`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...props}
    >
      {/* Real-time Cursor Specular Light Glint */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle 120px at ${cursorPos.x}px ${cursorPos.y}px, rgba(255, 255, 255, 0.65), rgba(212, 175, 55, 0.3) 50%, transparent 80%)`,
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

      {/* Button Content */}
      <span className="relative z-10 inline-flex items-center justify-center space-x-2">
        {children}
      </span>
    </button>
  );
};
