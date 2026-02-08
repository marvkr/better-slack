'use client';

import { useState } from 'react';
import { Task } from '@/lib/db/schema';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  currentUserId: string;
  onCompleteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
}

type TabType = 'todo' | 'sent' | 'done';

export function TaskList({ tasks, currentUserId, onCompleteTask, onCancelTask, onSelectTask }: TaskListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('todo');

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'todo') {
      return task.assigneeId === currentUserId && (task.status === 'assigned' || task.status === 'in_progress');
    }
    if (activeTab === 'sent') {
      return task.requesterId === currentUserId && task.status !== 'completed';
    }
    if (activeTab === 'done') {
      return task.status === 'completed';
    }
    return false;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with tabs */}
      <div className="p-6 pb-4">
        <div className="flex items-baseline gap-4 h-10">
          <button
            onClick={() => setActiveTab('todo')}
            className={`transition-all ${
              activeTab === 'todo'
                ? 'text-3xl font-bold text-gray-900'
                : 'text-lg text-gray-400 hover:text-gray-600'
            }`}
          >
            todo
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`transition-all ${
              activeTab === 'sent'
                ? 'text-3xl font-bold text-gray-900'
                : 'text-lg text-gray-400 hover:text-gray-600'
            }`}
          >
            sent
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`transition-all ${
              activeTab === 'done'
                ? 'text-3xl font-bold text-gray-900'
                : 'text-lg text-gray-400 hover:text-gray-600'
            }`}
          >
            done
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No tasks yet
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              hasNotification={task.status === 'assigned'}
              onComplete={activeTab === 'todo' ? onCompleteTask : undefined}
              onCancel={activeTab === 'todo' ? onCancelTask : undefined}
              onClick={onSelectTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
