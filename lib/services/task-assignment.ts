import { db } from '../db/client';
import { users } from '../db/schema';
import { sql } from 'drizzle-orm';
import type { User } from '../db/schema';

interface TaskRequirements {
  requiredSkills: string[];
  priority: string;
}

export async function findBestAssignee(
  task: TaskRequirements,
): Promise<User | null> {
  console.log('[findBestAssignee] Starting assignment search', {
    requiredSkills: task.requiredSkills,
    priority: task.priority,
  });

  const allUsers = await db.select().from(users);
  console.log(`[findBestAssignee] Fetched ${allUsers.length} total users`);

  let availableUsers = allUsers.filter(
    (user) => user.currentCapacity < user.maxCapacity,
  );
  console.log(
    `[findBestAssignee] ${availableUsers.length}/${allUsers.length} users have available capacity`,
  );

  // Fallback: if no one has capacity, pick user with least workload
  if (availableUsers.length === 0) {
    console.warn('[findBestAssignee] No users with available capacity — assigning to least busy user');
    const sortedByWorkload = [...allUsers].sort(
      (a, b) => a.currentCapacity - b.currentCapacity
    );
    availableUsers = [sortedByWorkload[0]];
  }

  const usersWithScores = availableUsers.map((user) => {
    const matchingSkills = task.requiredSkills.filter((skill) =>
      user.skills.includes(skill),
    );
    const skillMatchPercentage =
      task.requiredSkills.length > 0
        ? Math.round((matchingSkills.length / task.requiredSkills.length) * 100)
        : 100;

    const availableCapacity = user.maxCapacity - user.currentCapacity;
    const capacityPercentage = Math.round(
      (availableCapacity / user.maxCapacity) * 100,
    );

    console.log(`[findBestAssignee] Scored user "${user.name}"`, {
      matchingSkills,
      skillMatchPercentage,
      availableCapacity,
      capacityPercentage,
    });

    return {
      user,
      skillMatchPercentage,
      availableCapacity,
      capacityPercentage,
    };
  });

  let matchedUsers =
    task.requiredSkills.length > 0
      ? usersWithScores.filter((u) => u.skillMatchPercentage > 0)
      : usersWithScores;

  console.log(
    `[findBestAssignee] ${matchedUsers.length} users matched after skill filtering`,
  );

  // Fallback: if no skill match, assign to user with most capacity
  if (matchedUsers.length === 0) {
    console.warn('[findBestAssignee] No skill match found — falling back to capacity-based assignment');
    matchedUsers = usersWithScores;
  }

  matchedUsers.sort((a, b) => {
    if (b.availableCapacity !== a.availableCapacity) {
      return b.availableCapacity - a.availableCapacity;
    }
    return b.skillMatchPercentage - a.skillMatchPercentage;
  });

  const best = matchedUsers[0];
  console.log(`[findBestAssignee] Best assignee: "${best.user.name}"`, {
    skillMatch: best.skillMatchPercentage,
    capacity: best.availableCapacity,
  });

  return best.user;
}

export async function getAssignmentInfo(
  userId: string,
  task: TaskRequirements,
) {
  console.log('[getAssignmentInfo] Fetching info for user', { userId, task });

  const user = await db
    .select()
    .from(users)
    .where(sql`${users.id} = ${userId}`)
    .limit(1);

  if (!user[0]) {
    console.error(`[getAssignmentInfo] User ${userId} not found`);
    throw new Error(`User ${userId} not found`);
  }

  const u = user[0];
  const matchingSkills = task.requiredSkills.filter((skill) =>
    u.skills.includes(skill),
  );
  const skillMatchPercentage =
    task.requiredSkills.length > 0
      ? Math.round((matchingSkills.length / task.requiredSkills.length) * 100)
      : 100;

  const availableCapacity = u.maxCapacity - u.currentCapacity;
  const capacityPercentage = Math.round(
    (availableCapacity / u.maxCapacity) * 100,
  );

  const info = {
    userId: u.id,
    name: u.name,
    role: u.role || '',
    skillMatch: skillMatchPercentage,
    capacity: capacityPercentage,
  };

  console.log('[getAssignmentInfo] Result', info);
  return info;
}

export async function incrementUserCapacity(userId: string) {
  console.log(`[incrementUserCapacity] Incrementing capacity for user ${userId}`);
  await db
    .update(users)
    .set({ currentCapacity: sql`${users.currentCapacity} + 1` })
    .where(sql`${users.id} = ${userId}`);
  console.log(`[incrementUserCapacity] Done for user ${userId}`);
}

export async function decrementUserCapacity(userId: string) {
  console.log(`[decrementUserCapacity] Decrementing capacity for user ${userId}`);
  await db
    .update(users)
    .set({ currentCapacity: sql`GREATEST(0, ${users.currentCapacity} - 1)` })
    .where(sql`${users.id} = ${userId}`);
  console.log(`[decrementUserCapacity] Done for user ${userId}`);
}
