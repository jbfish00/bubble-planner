import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  onRemove?: () => void;
}

export function Badge({ children, color = '#E8A598', onRemove }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color + 'aa', color: '#1f2937', padding: '0.375rem 1rem' }}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-75 transition-opacity"
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
}
