# Observatory Sync Status API

This document describes the new API endpoints for tracking the status of the observatory data generation/synchronization process.

## Problem Solved

The observatory data generation process can take a long time to complete, and there was no way for clients to know:
- If a sync is currently running
- The progress of an ongoing sync  
- If a sync failed or was interrupted (e.g., due to PM2 restarts)

This implementation provides a robust, database-backed solution that persists across PM2 restarts and provides real-time progress tracking.

## API Endpoints

### 1. Check if Sync is Running
```
GET /observatory/is-sync-running
```

**Response:**
```json
{
  "success": true,
  "message": "success",
  "result": {
    "isRunning": false
  }
}
```

**Use Case:** Use this endpoint to enable/disable the sync button in your client application.

### 2. Get Current Running Sync Status
```
GET /observatory/running-sync-status
```

**Response (when sync is running):**
```json
{
  "success": true,
  "message": "success", 
  "result": {
    "id": 123,
    "status": "running",
    "type": "manual",
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": null,
    "totalChunks": 50,
    "processedChunks": 25,
    "totalDirectories": 1000,
    "processedDirectories": 500,
    "progressPercentage": 50,
    "estimatedTimeRemaining": 1800,
    "processId": "12345",
    "namespace": "admin",
    "amsid": 1
  }
}
```

**Response (when no sync is running):**
```json
{
  "success": true,
  "message": "success",
  "result": null
}
```

**Use Case:** Use this endpoint to show progress bars and estimated time remaining to users.

### 3. Get Latest Sync Status
```
GET /observatory/sync-status
```

**Response:**
```json
{
  "success": true,
  "message": "success",
  "result": {
    "id": 122,
    "status": "completed",
    "type": "auto", 
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T09:45:00.000Z",
    "totalChunks": 50,
    "processedChunks": 50,
    "totalDirectories": 1000,
    "processedDirectories": 1000,
    "progressPercentage": 100,
    "errorMessage": null,
    "processId": "12344",
    "namespace": "admin",
    "amsid": 1
  }
}
```

**Use Case:** Use this endpoint to show the status of the last sync (whether it completed successfully, failed, or was interrupted).

### 4. Generate Observatory Data (Enhanced)
```
POST /observatory/generate
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "success"
}
```

**Enhanced Behavior:**
- Now properly awaits completion before responding
- Automatically prevents concurrent syncs 
- Tracks progress in the database
- Handles PM2 restart scenarios

## Status Values

- `idle`: No sync activity
- `running`: Sync is currently in progress
- `completed`: Sync finished successfully
- `failed`: Sync encountered an error
- `interrupted`: Sync was stopped (e.g., PM2 restart)

## Type Values

- `auto`: Automatic sync triggered by cron job (daily at 1 AM)
- `manual`: Manual sync triggered via API

## Progress Tracking

The system tracks progress at two levels:

1. **Chunk Level**: `processedChunks` / `totalChunks`
2. **Directory Level**: `processedDirectories` / `totalDirectories`

The `progressPercentage` is calculated based on directories processed.

## PM2 Restart Handling

The solution handles PM2 restarts gracefully:

1. **Stale Detection**: Syncs running for more than 6 hours are automatically marked as `interrupted`
2. **Process Identification**: Each sync records its `processId`, `namespace`, and `amsid`
3. **Database Persistence**: All status information survives across restarts
4. **Automatic Recovery**: Stale syncs are cleaned up when new syncs attempt to start

## Client Implementation Example

```javascript
// Check if sync button should be enabled
async function updateSyncButton() {
  const response = await fetch('/observatory/is-sync-running');
  const { result } = await response.json();
  
  const syncButton = document.getElementById('syncButton');
  syncButton.disabled = result.isRunning;
  syncButton.textContent = result.isRunning ? 'Sync Running...' : 'Start Sync';
}

// Show progress during sync
async function showSyncProgress() {
  const response = await fetch('/observatory/running-sync-status');
  const { result } = await response.json();
  
  if (result) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.value = result.progressPercentage;
    progressText.textContent = `${result.processedDirectories}/${result.totalDirectories} directories processed`;
    
    if (result.estimatedTimeRemaining) {
      const eta = Math.floor(result.estimatedTimeRemaining / 60);
      progressText.textContent += ` (ETA: ${eta} minutes)`;
    }
  }
}

// Poll for updates during sync
let pollInterval;

function startPolling() {
  pollInterval = setInterval(async () => {
    await updateSyncButton();
    await showSyncProgress();
    
    const response = await fetch('/observatory/is-sync-running');
    const { result } = await response.json();
    
    if (!result.isRunning) {
      stopPolling();
      // Refresh data or show completion message
    }
  }, 2000); // Poll every 2 seconds
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
```

## Database Maintenance

The system automatically:
- Cleans up old sync status records daily (keeps last 50)
- Runs cleanup at 2 AM to avoid conflicts with the 1 AM sync
- Maintains proper indexes for efficient querying

## Migration

Run the migration script to create the required table:

```sql
mysql -u username -p database_name < migrations/create-observatory-sync-status.sql
```