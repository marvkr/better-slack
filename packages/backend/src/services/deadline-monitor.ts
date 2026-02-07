import { db } from '../db/client';
import { tasks } from '../db/schema';
import { sql } from 'drizzle-orm';

/**
 * Check deadlines for all active tasks
 * Returns tasks that need check-ins or reassignment
 */
export async function checkDeadlines() {
  const now = new Date();

  // Get all tasks that are assigned or in progress
  const activeTasks = await db
    .select()
    .from(tasks)
    .where(sql`${tasks.status} IN ('assigned', 'in_progress')`);

  const tasksNeedingAttention: Array<{
    task: typeof activeTasks[0];
    action: 'check_50' | 'warn_75' | 'reassign_90';
    progressPercentage: number;
  }> = [];

  for (const task of activeTasks) {
    if (!task.assignedAt || !task.deadline) continue;

    const startTime = task.assignedAt.getTime();
    const endTime = task.deadline.getTime();
    const currentTime = now.getTime();

    const totalDuration = endTime - startTime;
    const elapsed = currentTime - startTime;
    const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    // Check if we need to take action based on time progress vs task progress
    if (timeProgress >= 90 && task.progressPercentage < 75) {
      tasksNeedingAttention.push({
        task,
        action: 'reassign_90',
        progressPercentage: timeProgress
      });
    } else if (timeProgress >= 75 && task.progressPercentage < 50) {
      tasksNeedingAttention.push({
        task,
        action: 'warn_75',
        progressPercentage: timeProgress
      });
    } else if (timeProgress >= 50 && task.progressPercentage < 25) {
      tasksNeedingAttention.push({
        task,
        action: 'check_50',
        progressPercentage: timeProgress
      });
    }
  }

  return tasksNeedingAttention;
}

/**
 * Start background deadline monitoring
 * Checks every 5 minutes
 */
export function startDeadlineMonitor(onTaskNeedsAttention: (task: any) => void) {
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const check = async () => {
    try {
      const tasksNeedingAttention = await checkDeadlines();
      for (const item of tasksNeedingAttention) {
        onTaskNeedsAttention(item);
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  };

  // Run immediately then every 5 minutes
  check();
  const interval = setInterval(check, CHECK_INTERVAL);

  return () => clearInterval(interval);
}
