import type React from 'react';

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`rounded-tv-lg border border-tv-border shadow-tv ${intensityClasses[intensity]} ${hoverClasses} ${className}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        WebkitBackdropFilter: 'blur(40px)',
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
