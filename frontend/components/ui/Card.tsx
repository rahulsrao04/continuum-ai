import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}
