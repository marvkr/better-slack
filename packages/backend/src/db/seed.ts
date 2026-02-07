import { db } from './client';
import { users, tasks, messages } from './schema';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('Clearing existing data...');
  await db.delete(messages);
  await db.delete(tasks);
  await db.delete(users);

  // Create demo users matching frontend config
  console.log('Creating demo users...');
  const demoUsers = await db.insert(users).values([
    {
      id: 'sarah',
      name: 'Sarah Chen',
      email: 'sarah@dispatch.ai',
      role: 'Engineer',
      skills: ['code', 'typescript', 'react', 'api-design', 'testing'],
      currentCapacity: 0,
      maxCapacity: 5
    },
    {
      id: 'jordan',
      name: 'Jordan Rivers',
      email: 'jordan@dispatch.ai',
      role: 'Data Analyst',
      skills: ['data', 'analysis', 'sql', 'spreadsheets', 'visualization', 'python'],
      currentCapacity: 1, // Has one in-progress task
      maxCapacity: 5
    },
    {
      id: 'alex',
      name: 'Alex Park',
      email: 'alex@dispatch.ai',
      role: 'PM',
      skills: ['planning', 'writing', 'analysis', 'spreadsheets', 'user-research', 'roadmapping'],
      currentCapacity: 0,
      maxCapacity: 5
    }
  ]).returning();

  console.log(`Created ${demoUsers.length} demo users`);

  // Create a completed task for Wins feed
  console.log('Creating sample completed task...');
  await db.insert(tasks).values([
    {
      title: 'Customer satisfaction report Q4',
      description: 'Analyze Q4 customer satisfaction survey results and create summary report',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      priority: 'high',
      requiredSkills: ['data', 'analysis', 'spreadsheets'],
      status: 'completed',
      requesterId: 'sarah',
      assigneeId: 'jordan',
      assignedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      aiCompleted: false,
      progressPercentage: 100
    }
  ]);

  // Create an in-progress task at ~89% deadline (for reassignment demo)
  console.log('Creating in-progress task for reassignment demo...');
  const now = Date.now();
  const oneHourFromNow = new Date(now + 60 * 60 * 1000); // Deadline in 1 hour
  const startedTime = new Date(now - 8 * 60 * 60 * 1000); // Started 8 hours ago (total = 9 hours, so ~89% through)

  await db.insert(tasks).values([
    {
      title: 'Onboarding metrics dashboard',
      description: 'Create interactive dashboard showing user onboarding flow metrics',
      deadline: oneHourFromNow,
      priority: 'urgent',
      requiredSkills: ['data', 'visualization', 'python'],
      status: 'in_progress',
      requesterId: 'sarah',
      assigneeId: 'jordan',
      assignedAt: startedTime,
      aiCompleted: false,
      progressPercentage: 30 // Low progress despite being close to deadline
    }
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Demo users:');
  console.log('  - Sarah Chen (sarah) - Engineer');
  console.log('  - Jordan Rivers (jordan) - Data Analyst');
  console.log('  - Alex Park (alex) - PM');
  console.log('');
  console.log('Sample tasks:');
  console.log('  - 1 completed task (for Wins feed)');
  console.log('  - 1 in-progress task at 89% deadline (for reassignment demo)');
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
