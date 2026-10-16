import React, { useEffect, useRef } from 'react';

interface HeroGoldCanvasProps {
  isDark: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulseAngle: number;
  color: string;
}

export const HeroGoldCanvas: React.FC<HeroGoldCanvasProps> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse position with smooth lerp
    const mouse = {
      x: width * 0.5,
      y: height * 0.45,
      targetX: width * 0.5,
      targetY: height * 0.45,
      isHovering: false,
    };

    // Color palettes for gold bokeh dust
    const goldPaletteDark = [
      'rgba(212, 175, 55, ',   // Imperial Gold
      'rgba(243, 229, 171, ',  // Pale Warm Gold
      'rgba(229, 193, 88, ',   // Bright Gold
      'rgba(166, 124, 30, ',   // Deep Bronze Gold
    ];

    const goldPaletteLight = [
      'rgba(184, 134, 11, ',
      'rgba(212, 175, 55, ',
      'rgba(140, 98, 7, ',
      'rgba(200, 160, 40, ',
    ];

    const palette = isDark ? goldPaletteDark : goldPaletteLight;

    // Initialize 45 subtle bokeh dust particles
    const particleCount = Math.min(48, Math.floor((width * height) / 18000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseRadius = Math.random() * 2.2 + 0.8;
      const baseAlpha = Math.random() * (isDark ? 0.28 : 0.22) + 0.08;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: baseRadius,
        baseRadius,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.4 - 0.1, // gently drift upward
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseAngle: Math.random() * Math.PI * 2,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.45;
      mouse.isHovering = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    // Main render loop
    let lastTime = performance.now();
    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Smooth lerp mouse spotlight
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Ambient Radial Spotlight Flare following cursor
      const spotlightRadius = Math.min(width, height) * 0.48;
      const spotlightGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        spotlightRadius
      );

      if (isDark) {
        spotlightGrad.addColorStop(0, 'rgba(212, 175, 55, 0.14)');
        spotlightGrad.addColorStop(0.35, 'rgba(212, 175, 55, 0.05)');
        spotlightGrad.addColorStop(0.75, 'rgba(212, 175, 55, 0.01)');
        spotlightGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      } else {
        spotlightGrad.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
        spotlightGrad.addColorStop(0.35, 'rgba(212, 175, 55, 0.05)');
        spotlightGrad.addColorStop(0.75, 'rgba(212, 175, 55, 0.01)');
        spotlightGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      }

      ctx.fillStyle = spotlightGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, spotlightRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Secondary static soft gold atmospheric pool in center
      const centerPool = ctx.createRadialGradient(
        width * 0.5,
        height * 0.38,
        0,
        width * 0.5,
        height * 0.38,
        Math.min(width, height) * 0.55
      );
      if (isDark) {
        centerPool.addColorStop(0, 'rgba(243, 229, 171, 0.06)');
        centerPool.addColorStop(1, 'rgba(8, 8, 10, 0)');
      } else {
        centerPool.addColorStop(0, 'rgba(212, 175, 55, 0.08)');
        centerPool.addColorStop(1, 'rgba(250, 248, 245, 0)');
      }
      ctx.fillStyle = centerPool;
      ctx.fillRect(0, 0, width, height);

      // 3. Render and animate bokeh gold particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gentle sinusoidal pulsation
        p.pulseAngle += p.pulseSpeed;
        p.radius = p.baseRadius + Math.sin(p.pulseAngle) * 0.6;
        p.alpha = Math.max(0.04, p.baseAlpha + Math.sin(p.pulseAngle) * 0.08);

        // Motion physics with slight repulsion/affinity around mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          // Soft proximity illumination
          p.alpha = Math.min(isDark ? 0.65 : 0.5, p.alpha + (1 - dist / 140) * 0.25);
          p.x += (p.vx - (dx / dist) * 0.4) * dt * 60;
          p.y += (p.vy - (dy / dist) * 0.4) * dt * 60;
        } else {
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
        }

        // Boundary wrapping
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Draw particle with soft halo
        ctx.beginPath();
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
        radGrad.addColorStop(0, `${p.color}${p.alpha})`);
        radGrad.addColorStop(0.5, `${p.color}${p.alpha * 0.4})`);
        radGrad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = radGrad;
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none -z-10 block"
      style={{
        width: '100%',
        height: '100%',
        opacity: isDark ? 0.95 : 0.85,
      }}
      aria-hidden="true"
    />
  );
};
