# Dispatch - AI Native Task Coordination

> Stop chatting, start doing.

Dispatch is an AI-native task coordination system for B2B teams. Instead of chat-based communication, team members tell the system what they need, and a central AI intelligently routes tasks to the best-qualified available person - or completes the task autonomously if possible.

## The Problem

- Messages are unclear between coworkers
- People get assigned tasks when they're already at capacity
- Passive-aggressive communication and workplace friction
- Time wasted on tasks that AI could handle

## The Solution

1. **Tell the AI what you need** - Natural language task requests
2. **AI decides the best approach**:
   - **AI Direct**: Completes task immediately (writing, analysis, etc.)
   - **Human Assignment**: Routes to best-matched team member based on skills & capacity
3. **Anonymous task assignment** - No bias, just work
4. **Automatic reassignment** - Tasks get reassigned before deadlines if not on track
5. **Smart notifications** - Real-time updates on task progress

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon (Serverless Postgres) + Drizzle ORM
- **AI**: Anthropic Claude API (Sonnet 4.5)

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=your_neon_connection_string
ANTHROPIC_API_KEY=your_claude_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get your credentials:**
- **Neon**: https://neon.tech (free tier, create new project)
- **Claude API**: https://console.anthropic.com (get API key)

### 3. Setup Database

```bash
bun run db:setup
```

This creates tables and seeds demo users:
- **Sarah Chen** (Engineer) - Default user
- **Jordan Rivers** (Data Analyst)
- **Alex Park** (PM)

### 4. Start Development Server

```bash
bun run dev
```

Open http://localhost:3000

## Project Structure

```
dispatch/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # AI coordinator endpoint
│   │   ├── tasks/        # Task CRUD
│   │   └── users/        # User management
│   ├── page.tsx          # Home page (TODO: UI)
│   └── layout.tsx        # Root layout
├── lib/
│   ├── db/
│   │   ├── schema.ts     # Database schema
│   │   ├── client.ts     # Neon connection
│   │   └── seed.ts       # Demo data seeder
│   └── services/
│       ├── ai-coordinator.ts    # Claude API integration
│       └── task-assignment.ts   # Assignment algorithm
├── public/
│   └── logo.png          # Dispatch logo
└── drizzle.config.ts     # Drizzle ORM config
```

## API Endpoints

### Chat
- `POST /api/chat` - Send message to AI coordinator
  - Body: `{ message: string, userId: string }`
  - Returns: Task assignment or AI direct result

### Tasks
- `GET /api/tasks?userId={id}&view={my-tasks|sent|done}` - Get tasks
- `POST /api/tasks/{id}/complete` - Mark task complete
  - Body: `{ userId: string }`

### Users
- `GET /api/users` - List all users

## Database Schema

### Users
- id (text) - 'sarah', 'jordan', 'alex'
- name, email, role
- skills (array) - e.g., ['code', 'typescript', 'react']
- currentCapacity / maxCapacity - Task load management

### Tasks
- id (uuid)
- title, description, deadline, priority
- requiredSkills (array)
- status - 'pending' | 'assigned' | 'in_progress' | 'completed'
- requesterId / assigneeId - Anonymous until completion
- aiCompleted - Boolean for AI direct execution
- aiResult - Result text for AI-completed tasks
- progressPercentage - 0-100

### Messages
- Task-scoped chat threads
- Links to tasks for conversation history

## How It Works

### 1. Task Coordination Flow

```
User types: "I need a summary of last week's metrics by Friday"
        ↓
AI Coordinator analyzes request
        ↓
    Determines execution tier:
    - ai_direct: AI completes immediately
    - human: Assigns to best match
        ↓
Task Assignment Algorithm:
    1. Find users with required skills
    2. Filter by available capacity
    3. Sort by: capacity DESC, skill match DESC
    4. Assign to top match
        ↓
Task created & user notified
```

### 2. AI Coordinator

Uses Claude to:
- Parse natural language into structured task data
- Determine if task can be completed autonomously
- Extract title, description, deadline, priority, required skills
- Execute ai_direct tasks immediately

### 3. Assignment Algorithm

```typescript
function findBestAssignee(task):
  1. Get all users
  2. Filter: currentCapacity < maxCapacity
  3. Calculate skill match percentage
  4. Filter: has ≥1 required skill
  5. Sort by: available capacity DESC, skill match DESC
  6. Return top match
```

## Development Commands

```bash
# Development
bun run dev              # Start dev server

# Database
bun run db:push          # Push schema to database
bun run db:seed          # Seed demo data
bun run db:setup         # Push + seed (fresh start)
bun run db:generate      # Generate migration

# Build
bun run build            # Production build
bun run start            # Start production server
```

## Demo Users

**Sarah Chen** (Engineer)
- Skills: code, typescript, react, api-design, testing
- ID: `sarah`

**Jordan Rivers** (Data Analyst)
- Skills: data, analysis, sql, spreadsheets, visualization, python
- ID: `jordan`

**Alex Park** (PM)
- Skills: planning, writing, analysis, spreadsheets, user-research, roadmapping
- ID: `alex`

## Next Steps (Frontend)

- [ ] Build main UI (split view: task list + chat)
- [ ] Implement task cards with status indicators
- [ ] Add real-time updates with WebSocket
- [ ] Create task detail view with chat thread
- [ ] Add user switcher for demo
- [ ] Implement deadline conversation dialog
- [ ] Add progress tracking UI

## Testing

Test the API directly:

```bash
# Get users
curl http://localhost:3000/api/users

# Create task via chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help analyzing Q4 metrics by Friday",
    "userId": "sarah"
  }'

# Get my tasks
curl "http://localhost:3000/api/tasks?userId=jordan&view=my-tasks"

# Complete task
curl -X POST http://localhost:3000/api/tasks/{task-id}/complete \
  -H "Content-Type: application/json" \
  -d '{"userId": "jordan"}'
```

## License

MIT
