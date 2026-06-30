import React from 'react';

interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
}

export default function Badge({ label, color = '#6C63FF', className = '' }: BadgeProps) {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: color, color: 'white' }}
    >
      {label}
    </span>
  );
}
