import type React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-tv transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-tv-accent text-white border border-tv-accent hover:bg-tv-accent-hover hover:shadow-glow active:scale-95',
    secondary:
      'bg-tv-surface text-tv-text border border-tv-border hover:bg-tv-surface-light hover:border-tv-border-hover backdrop-blur-glass active:scale-95',
    ghost:
      'bg-transparent text-tv-text border border-transparent hover:bg-tv-surface/50 hover:backdrop-blur-glass-light active:scale-95',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={
        variant === 'secondary'
          ? {
              WebkitBackdropFilter: 'blur(20px)',
            }
          : undefined
      }
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default GlassButton;
