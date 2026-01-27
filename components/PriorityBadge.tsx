
import React from 'react';
import { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [Priority.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-200',
    [Priority.HIGH]: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[priority]}`}>
      {priority}
    </span>
  );
};
