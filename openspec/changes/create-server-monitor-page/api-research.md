# Beszel API Research Findings

## Authentication
- PocketBase token auth: `Authorization: <token>` header
- Token obtained via `/api/collections/users/auth-with-password`

## Key Endpoints

### 1. Get System List (for finding system ID)
```
GET /api/collections/systems/records
Headers: Authorization: <token>
Query: filter=status="up"
```

### 2. Get Latest System Stats (current metrics)
```
GET /api/collections/system_stats/records
Headers: Authorization: <token>
Query: 
  filter=system={systemId} && type="1m"
  sort=-created
  perPage=1
  fields=created,stats
```

### 3. Realtime WebSocket (for live updates)
```
GET /api/realtime (WebSocket)
Topic: rt_metrics:{systemId}
```

## Data Format (Stats object in system_stats)

```json
{
  "cpu": 15.5,           // CPU usage %
  "m": 16384000000,      // Memory total (bytes)
  "mu": 8192000000,      // Memory used (bytes)
  "mp": 50.0,            // Memory usage %
  "d": 500000000000,     // Disk total (bytes)
  "du": 250000000000,    // Disk used (bytes)
  "dp": 50.0,            // Disk usage %
  "b": [1000000, 2000000],  // Bandwidth [sent, recv] bytes
  "ns": 0,               // Deprecated network sent MB
  "nr": 0,               // Deprecated network recv MB
  "la": [0.5, 0.3, 0.2], // Load avg [1m, 5m, 15m]
  "dr": 1000000,         // Disk read bytes/sec
  "dw": 500000,          // Disk write bytes/sec
  "cpub": [5, 2, 1, 0, 92], // CPU breakdown [user, system, iowait, steal, idle]
  "t": {},               // Temperatures
  "ni": {},              // Network interfaces
  "efs": {},             // Extra filesystems
  "g": {}                // GPU data
}
```

## Implementation Approach for Monitor Page

1. **Authentication**: Need token (could be hardcoded or passed via query param)
2. **System Selection**: Get first "up" system or use specific system ID
3. **Polling**: 
   - Option A: Query `system_stats` collection every 1s (simple, REST)
   - Option B: Use WebSocket realtime (more complex, but real-time)
4. **Data Parsing**: Extract `stats` field from latest record

## Recommended: REST Polling (simpler, compatible with Android 4)

Endpoint: `GET /api/collections/system_stats/records?filter=system={id}&&type="1m"&sort=-created&perPage=1&fields=created,stats`

Returns:
```json
{
  "items": [
    {
      "created": "2024-01-15 10:30:00.000Z",
      "stats": { ... }
    }
  ]
}
```

Note: The `stats` field is stored as JSON in PocketBase.