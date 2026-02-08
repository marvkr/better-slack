# Database-UI Synchronization Fix

## Problem
The UI tickets were not reflecting the database state because:

1. **Missing Authentication Header**: The API client was sending `userId` as query params or body data, but the backend requires `X-User-Id` header
2. **No Data Mapping**: Backend task format (PostgreSQL schema) was never mapped to frontend `DispatchTask` format
3. **Data Never Added to State**: Fetched data had a TODO comment and was never actually added to the Jotai atoms
4. **Incorrect WebSocket API**: Used non-existent methods like `ws.subscribeToUser()` and `ws.onMessage()`

## Solution

### 1. Fixed API Client ([api-client.ts](apps/electron/src/renderer/lib/api-client.ts))
- ✅ Added `BackendTask` interface matching the database schema
- ✅ Created `createHeaders()` helper to add `X-User-Id` header to all requests
- ✅ Updated all API functions to use proper headers:
  - `getMyTasks(userId)` - now sends header instead of query param
  - `getSentTasks(userId)` - now sends header instead of query param
  - `getDoneTasks(userId)` - now sends header instead of query param
  - `completeTask(taskId, userId)` - now sends header, removed body param
  - `reassignTask(...)` - now sends header correctly

### 2. Added Data Mapping ([DispatchContext.tsx](apps/electron/src/renderer/context/DispatchContext.tsx))
- ✅ Created `mapBackendTaskToDispatchTask()` function to convert database format to UI format
- ✅ Maps all fields correctly:
  - Backend timestamps (ISO strings) → Frontend timestamps (numbers)
  - Backend `assignedAt` → Frontend `startedAt`
  - Backend `aiResult` → Frontend `result`
  - Backend `aiCompleted` → Frontend `executionTier` (inferred)
  - Adds defaults for frontend-only fields (`isAnonymous`, `originalIntent`, etc.)

### 3. Fixed Data Loading
- ✅ Updated `fetchInitialData()` to actually use the mapper
- ✅ Deduplicates tasks across the three API calls (myTasks, sentTasks, doneTasks)
- ✅ Adds all fetched tasks to Jotai state using `addTask()`
- ✅ Falls back to demo data if backend is unavailable

### 4. Fixed WebSocket Integration
- ✅ Replaced `ws.subscribeToUser()` with proper `subscribe()` function
- ✅ Replaced `ws.onMessage()` with proper `subscribe()` callback
- ✅ Added `sendMessage()` to send user subscription on connection
- ✅ Updated all WebSocket handlers to map backend tasks to frontend format

## Data Flow

```
Database (PostgreSQL)
  ↓
Backend API (Hono) - requires X-User-Id header
  ↓
API Client (fetch with proper headers)
  ↓
mapBackendTaskToDispatchTask() - converts format
  ↓
Jotai Atoms (dispatchTasksAtom)
  ↓
React Components (DispatchLayout, DispatchTaskCard)
  ↓
UI Display
```

## Real-time Updates

```
Backend Event (task created/updated/completed)
  ↓
WebSocket Server (ws://localhost:3001/ws)
  ↓
WebSocket Client (subscribe())
  ↓
DispatchContext Message Handler
  ↓
mapBackendTaskToDispatchTask() - converts format
  ↓
updateTask() or addTask() - updates Jotai atoms
  ↓
UI Automatically Re-renders
```

## Testing Checklist

To verify the fix works:

1. ✅ Start the backend: `cd packages/backend && bun run dev`
2. ✅ Start the frontend: `bun run electron:dev`
3. ✅ Check browser console for: `[DispatchContext] Loaded tasks from backend:`
4. ✅ Verify tasks appear in the UI (not demo data)
5. ✅ Complete a task and verify it moves to "Done" tab
6. ✅ Check that database state matches UI state
7. ✅ Verify WebSocket updates work in real-time

## Files Changed

1. `apps/electron/src/renderer/lib/api-client.ts` - Fixed headers and added types
2. `apps/electron/src/renderer/context/DispatchContext.tsx` - Added mapper and fixed data loading

## Next Steps (Optional Improvements)

- Add error handling for partial failures
- Add loading states while fetching
- Add optimistic UI updates with rollback on error
- Add periodic background refresh to catch missed WebSocket events
- Add retry logic for failed API calls
