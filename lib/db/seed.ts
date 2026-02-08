import { db } from './client';
import { users, tasks, messages } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.delete(messages);
  await db.delete(tasks);
  await db.delete(users);

  // Create demo users
  console.log('Creating demo users...');
  await db.insert(users).values([
    {
      id: 'sarah',
      name: 'Sarah Chen',
      email: 'sarah@dispatch.ai',
      role: 'Engineer',
      skills: ['code', 'typescript', 'react', 'api-design', 'testing', 'documentation', 'debugging', 'architecture', 'review', 'automation', 'devops', 'general'],
      currentCapacity: 0,
      maxCapacity: 5
    },
    {
      id: 'jordan',
      name: 'Jordan Rivers',
      email: 'jordan@dispatch.ai',
      role: 'Data Analyst',
      skills: ['data', 'analysis', 'sql', 'spreadsheets', 'visualization', 'python', 'reporting', 'metrics', 'dashboards', 'research', 'presentation', 'slides', 'general'],
      currentCapacity: 1,
      maxCapacity: 5
    },
    {
      id: 'alex',
      name: 'Alex Park',
      email: 'alex@dispatch.ai',
      role: 'PM',
      skills: ['planning', 'writing', 'analysis', 'spreadsheets', 'user-research', 'roadmapping', 'communication', 'documentation', 'presentation', 'slides', 'coordination', 'scheduling', 'general'],
      currentCapacity: 0,
      maxCapacity: 5
    }
  ]);

  // Create sample tasks
  console.log('Creating sample tasks...');
  await db.insert(tasks).values([
    {
      title: 'Customer satisfaction report Q4',
      description: 'Analyze Q4 customer satisfaction survey results',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      priority: 'high',
      requiredSkills: ['data', 'analysis'],
      status: 'completed',
      requesterId: 'sarah',
      assigneeId: 'jordan',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      progressPercentage: 100
    },
    {
      title: 'Onboarding metrics dashboard',
      description: 'Create interactive dashboard for onboarding metrics',
      deadline: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      priority: 'urgent',
      requiredSkills: ['data', 'visualization'],
      status: 'in_progress',
      requesterId: 'sarah',
      assigneeId: 'jordan',
      assignedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      progressPercentage: 30
    }
  ]);

  console.log('✅ Database seeded successfully!');
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
