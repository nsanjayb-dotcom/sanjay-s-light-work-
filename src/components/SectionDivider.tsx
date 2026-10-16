import React from 'react';

interface SectionDividerProps {
  isDark?: boolean;
  className?: string;
}

/**
 * Section divider matching https://lightworks-studio-gold.lovable.app
 */
export const SectionDivider: React.FC<SectionDividerProps> = ({
  className = '',
}) => {
  return (
    <div className={`section-divider ${className}`} aria-hidden="true">
      <span className="text-[var(--gold)]">✦</span>
    </div>
  );
};
