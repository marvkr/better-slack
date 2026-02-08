'use client';

import { useState, useEffect } from 'react';
import { TaskList } from '@/components/TaskList';
import { ChatPanel } from '@/components/ChatPanel';
import { TaskDetail } from '@/components/TaskDetail';
import type { Task } from '@/lib/db/schema';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUserId, setCurrentUserId] = useState('sarah');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch tasks on mount and when user changes
  useEffect(() => {
    fetchTasks();
  }, [currentUserId]);

  const fetchTasks = async () => {
    try {
      // Fetch all tasks for user (both assigned and requested)
      const response = await fetch(`/api/tasks?userId=${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (message: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId: currentUserId }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      const result = await response.json();

      // If task was assigned to current user, add it to the list
      if (result.task && result.assignedTo?.userId === currentUserId) {
        await fetchTasks();
      }

      // Show success notification
      alert(result.reasoning);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) throw new Error('Failed to complete task');

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const handleCancelTask = async (taskId: string) => {
    // TODO: Implement task cancellation/reassignment
    alert('Cancel task functionality coming soon!');
  };

  const handleSelectTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task || null);
  };

  if (isLoading) {
    return (
      <div className='h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-gray-400'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='h-screen flex bg-gray-50'>
      {/* User switcher - temporary for demo */}
      <div className='absolute top-4 left-1/2 -translate-x-1/2 z-10'>
        <select
          value={currentUserId}
          onChange={(e) => setCurrentUserId(e.target.value)}
          className='px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer'
        >
          <option value='sarah'>Sarah Chen (Engineer)</option>
          <option value='jordan'>Jordan Rivers (Data Analyst)</option>
          <option value='alex'>Alex Park (PM)</option>
        </select>
      </div>

      {/* Left Panel - Task List */}
      <div className='w-1/2 border-r border-gray-200'>
        <TaskList
          tasks={tasks}
          currentUserId={currentUserId}
          onCompleteTask={handleCompleteTask}
          onCancelTask={handleCancelTask}
          onSelectTask={handleSelectTask}
        />
      </div>

      {/* Right Panel - Chat or Task Detail */}
      <div className='w-1/2'>
        {selectedTask ? (
          <TaskDetail
            task={selectedTask}
            onBack={() => setSelectedTask(null)}
          />
        ) : (
          <ChatPanel onCreateTask={handleCreateTask} />
        )}
      </div>
    </div>
  );
}
