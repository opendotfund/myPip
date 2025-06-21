
import React from 'react';

interface IconProps {
  className?: string;
}

export const CopyIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 4.625v2.625m-7.5-2.625v2.625m0-2.625H12m0 0V9.75m0 5.625v2.625m0-2.625C12 15.375 12.25 15 12.5 15h3.75c.25 0 .5-.375.5-.625V9.75A1.875 1.875 0 0014.25 7.875h-3.75A1.875 1.875 0 008.625 9.75v5.625c0 .25.25.625.5.625h3.75ZM16.5 9.75h-3.75" 
    />
  </svg>
);
    