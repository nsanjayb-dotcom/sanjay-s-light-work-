import React from 'react';
import { soundEngine } from '../utils/audio';

interface BrandLogoProps {
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  isDark, 
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  // Proportions exactly matching original logo: width 440, height 110 (viewBox: 0 0 440 110)
  const scales = {
    sm: { height: 32, width: 128 },
    md: { height: 42, width: 168 },
    lg: { height: 58, width: 232 },
    xl: { height: 76, width: 304 },
  };

  const currentScale = scales[size];
  const primaryColor = isDark ? '#ffffff' : '#141416';
  const sublineColor = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 22, 0.9)';
  const lineColor = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(20, 20, 22, 0.7)';

  const handleClick = () => {
    soundEngine.playClick();
    soundEngine.triggerHaptic(20);
  };

  return (
    <div 
      className={`inline-flex items-center select-none cursor-pointer transition-opacity hover:opacity-90 active:scale-[0.99] ${className}`}
      title="Sanjay's Lightworks"
      onClick={handleClick}
    >
      <svg
        width={currentScale.width}
        height={currentScale.height}
        viewBox="0 0 440 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label="Sanjay's Lightworks Logo"
      >
        {/* ========================================================================= */}
        {/* EXACT ORIGINAL LOGO: "SANJAY'S" with custom aperture A, swoosh, and star  */}
        {/* ========================================================================= */}
        <g id="sanjays-wordmark">
          {/* Letter 'S' */}
          <text
            x="48"
            y="65"
            fill={primaryColor}
            fontFamily="'Cinzel', 'Playfair Display', 'Bodoni MT', 'Didot', Georgia, serif"
            fontSize="52"
            fontWeight="600"
            textAnchor="middle"
          >
            S
          </text>

          {/* ------------------- STYLIZED FIRST 'A' WITH APERTURE & SWOOSH ------------------- */}
          <g id="aperture-A">
            {/* Taller sharp Apex 'A' outline: Left thin leg, Right thick leg */}
            {/* Apex at (104, 18), left foot at (80, 65), right foot at (128, 65) */}
            <path
              d="M 103.5 17 L 105.5 17 L 129 65 H 119.5 L 111.5 48.5 H 96.5 L 88.5 65 H 79 Z"
              fill={primaryColor}
            />

            {/* Inward triangular counter cutout */}
            <path
              d="M 104 26 L 109 43 H 99 Z"
              fill={isDark ? '#0a0a0c' : '#f5f4ef'}
            />

            {/* 6-Blade Camera Aperture Iris centered right in the base of the A */}
            <g transform="translate(104, 52.5)">
              {/* Outer aperture boundary ring */}
              <circle
                cx="0"
                cy="0"
                r="10"
                fill={isDark ? '#0a0a0c' : '#f5f4ef'}
                stroke={primaryColor}
                strokeWidth="1.2"
              />

              {/* 6 Overlapping Iris Blades matching exact camera lens aperture */}
              <path d="M -8.5 -2.5 L 2 -9 L -2 -1.5 Z" fill={primaryColor} />
              <path d="M 2 -9 L 9 -1 L 0 -1.5 Z" fill={primaryColor} />
              <path d="M 9 -1 L 4 8 L 1.5 0 Z" fill={primaryColor} />
              <path d="M 4 8 L -7.5 4 L -1.5 1.5 Z" fill={primaryColor} />
              <path d="M -7.5 4 L -8 -6 L 0 -1.5 Z" fill={primaryColor} />
              <path d="M -8 -6 L 2 -9 L -3 -3 Z" fill={primaryColor} />

              {/* Center optical opening */}
              <circle cx="0" cy="0" r="2" fill={isDark ? '#0a0a0c' : '#f5f4ef'} />
            </g>

            {/* ORBITAL SWOOSH: Starts from bottom-left of A, curves under/around aperture, slices across right leg, arcs over N */}
            <path
              d="M 81 66 C 70 70, 71 52, 85 41 C 99 30, 118 31, 137 41 C 158 52, 178 32, 204 19.5"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* 4-POINT CELESTIAL STARBURST at the tip of the swoosh (above N & J) */}
            <g transform="translate(205, 19)">
              {/* Vertical Diamond Spike */}
              <path
                d="M 0 -9 Q 0.6 -1.8 4 0 Q 0.6 1.8 0 9 Q -0.6 1.8 -4 0 Q -0.6 -1.8 0 -9 Z"
                fill={primaryColor}
              />
              {/* Horizontal Diamond Spike (slightly wider cross) */}
              <path
                d="M -7.5 0 Q -1.5 0.5 0 4 Q 1.5 0.5 7.5 0 Q 1.5 -0.5 0 -4 Q -1.5 -0.5 -7.5 0 Z"
                fill={primaryColor}
              />
              {/* Center brilliant core point */}
              <circle cx="0" cy="0" r="1.2" fill={primaryColor} />
            </g>
          </g>

          {/* Letter 'N' */}
          <text
            x="160"
            y="65"
            fill={primaryColor}
            fontFamily="'Cinzel', 'Playfair Display', 'Bodoni MT', 'Didot', Georgia, serif"
            fontSize="52"
            fontWeight="600"
            textAnchor="middle"
          >
            N
          </text>

          {/* Letter 'J' with descending hook */}
          <text
            x="211"
            y="65"
            fill={primaryColor}
            fontFamily="'Cinzel', 'Playfair Display', 'Bodoni MT', 'Didot', Georgia, serif"
            fontSize="52"
            fontWeight="600"
            textAnchor="middle"
          >
            J
          </text>

          {/* Second Letter 'A' */}
          <text
            x="260"
            y="65"
            fill={primaryColor}
            fontFamily="'Cinzel', 'Playfair Display', 'Bodoni MT', 'Didot', Georgia, serif"
            fontSize="52"
            fontWeight="600"
            textAnchor="middle"
          >
            A
          </text>

          {/* Letter 'Y' */}
          <text
            x="310"
            y="65"
            fill={primaryColor}
            fontFamily="'Cinzel', 'Playfair Display', 'Bodoni MT', 'Didot', Georgia, serif"
            fontSize="52"
            fontWeight="600"
            textAnchor="middle"
          >
            Y
          </text>

          {/* Apostrophe "'" */}
          <text
            x="346"
            y="48"
            fill={primaryColor}
            fontFamily="'Cinzel', 'Playfair Display', 'Bodoni MT', 'Didot', Georgia, serif"
            fontSize="38"
            fontWeight="600"
            textAnchor="middle"
          >
            ’
          </text>

          {/* Final Letter 'S' */}
          <text
            x="376"
            y="65"
            fill={primaryColor}
            fontFamily="'Cinzel', 'Playfair Display', 'Bodoni MT', 'Didot', Georgia, serif"
            fontSize="52"
            fontWeight="600"
            textAnchor="middle"
          >
            S
          </text>
        </g>

        {/* ========================================================================= */}
        {/* SUBTITLE: ────────  L I G H T W O R K S  ────────                         */}
        {/* ========================================================================= */}
        {showSubtitle && (
          <g transform="translate(0, 91)">
            {/* Left rule line */}
            <line
              x1="38"
              y1="0"
              x2="136"
              y2="0"
              stroke={lineColor}
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* LIGHTWORKS Centered Title */}
            <text
              x="220"
              y="3.5"
              fill={sublineColor}
              fontFamily="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
              fontSize="12.5"
              fontWeight="600"
              letterSpacing="0.44em"
              textAnchor="middle"
            >
              LIGHTWORKS
            </text>

            {/* Right rule line */}
            <line
              x1="304"
              y1="0"
              x2="402"
              y2="0"
              stroke={lineColor}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
