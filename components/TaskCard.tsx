'use client';

import { Task } from '@/lib/db/schema';

interface TaskCardProps {
  task: Task;
  hasNotification?: boolean;
  onComplete?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
}

export function TaskCard({ task, hasNotification, onComplete, onCancel, onClick }: TaskCardProps) {
  const formatDeadline = (deadline: Date) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(task.id)}
    >
      {hasNotification && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full" />
      )}

      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
          {task.title}
        </h3>
      </div>

      <p className="text-gray-600 text-sm mb-4">
        {task.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-full">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <span>{formatDeadline(task.deadline)}</span>
        </div>

        {task.status !== 'completed' && (
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(task.id);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Can't do"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
            {onComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(task.id);
                }}
                className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                aria-label="Complete"
              >
                <span className="material-symbols-outlined text-xl text-green-700">check</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
