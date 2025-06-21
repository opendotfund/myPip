
import React from 'react';

interface IconProps {
  className?: string;
}

export const CheckIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} // Changed from 2 to 1.5 for a slightly thinner look if preferred
    stroke="currentColor" 
    className={className || "w-6 h-6 text-emerald-600"} // Changed color for better contrast
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
