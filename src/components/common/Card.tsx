import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  border = false,
  hoverable = false,
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };

  const borderClass = border ? 'border border-gray-200' : '';
  const hoverClass = hoverable ? 'transition-all duration-200 hover:shadow-md' : '';
  
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm ${paddingClasses[padding]} ${borderClass} ${hoverClass} ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;