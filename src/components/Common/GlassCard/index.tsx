import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  intensity = 'medium',
  hover = false,
  onClick,
}) => {
  const intensityClasses = {
    light: 'bg-tv-card/40 backdrop-blur-glass-light',
    medium: 'bg-tv-card backdrop-blur-glass',
    strong: 'bg-tv-card/90 backdrop-blur-glass-strong',
  };

  const hoverClasses = hover
    ? 'hover:bg-tv-card-hover hover:shadow-tv-lg hover:scale-[1.02] transform transition-all duration-300 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-tv-lg border border-tv-border shadow-tv ${intensityClasses[intensity]} ${hoverClasses} ${className}`}
      onClick={onClick}
      style={{
        WebkitBackdropFilter: 'blur(40px)',
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
