import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top',
  className = ''
}) => {
  return (
    <div className={`group relative inline-flex ${className}`}>
      {children}
      <div className={`
        absolute px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg 
        opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out 
        pointer-events-none z-[100] whitespace-nowrap shadow-xl
        ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
        ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
        ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
        ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
      `}>
        {content}
        {/* Arrow */}
        <div className={`
          absolute w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-100
          ${position === 'top' ? 'bottom-[-3px] left-1/2 -translate-x-1/2' : ''}
          ${position === 'bottom' ? 'top-[-3px] left-1/2 -translate-x-1/2' : ''}
          ${position === 'left' ? 'right-[-3px] top-1/2 -translate-y-1/2' : ''}
          ${position === 'right' ? 'left-[-3px] top-1/2 -translate-y-1/2' : ''}
        `}></div>
      </div>
    </div>
  );
};