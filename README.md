# MongoDB Custom Node

MongoDB database node for workflow automation platform. Execute queries, insert, update, and delete documents in MongoDB collections.

## Features

- **Find Documents**: Query documents with flexible filters, projection, sorting, and limits
- **Insert**: Add single or multiple documents to collections
- **Update**: Modify existing documents with update operators
- **Delete**: Remove documents from collections
- **Aggregate**: Run MongoDB aggregation pipelines for complex data transformations
- **Dynamic Collection Loading**: Autocomplete collections from your database
- **Flexible Authentication**: Support for connection strings or individual parameters
- **MongoDB Atlas Support**: Automatic detection and configuration for Atlas clusters

## Installation

```bash
npm install
```

## Dependencies

- `mongodb`: ^6.3.0 - Official MongoDB driver for Node.js

## Configuration

### Connection Types

1. **Connection String**: Use a complete MongoDB connection string
   - `mongodb://localhost:27017/mydb` (local)
   - `mongodb+srv://user:pass@cluster.mongodb.net/mydb` (Atlas)

2. **Individual Parameters**: Configure host, port, database, credentials separately
   - Automatically detects MongoDB Atlas clusters
   - Supports SSL configuration

## Operations

### Find Documents

Query documents from a collection with optional:
- Filters (MongoDB query syntax)
- Projection (field selection)
- Sorting
- Skip and limit
- Return all or limited results

### Insert Documents

Add documents to a collection:
- **Single Document**: Insert one document
- **Multiple Documents**: Insert array of documents

### Update Documents

Modify documents matching a filter:
- **Update One**: Update first matching document
- **Update Many**: Update all matching documents
- Support for MongoDB update operators ($set, $inc, etc.)
- Optional upsert functionality

### Delete Documents

Remove documents from a collection:
- **Delete One**: Remove first matching document
- **Delete Many**: Remove all matching documents

### Aggregate

Execute MongoDB aggregation pipelines:
- Complex data transformations
- Grouping and calculations
- Multi-stage processing

## Settings

- **Connection Timeout**: Configure connection timeout (default: 5000ms)
- **Read Preference**: Set read preference for queries
  - Primary (default)
  - Primary Preferred
  - Secondary
  - Secondary Preferred
  - Nearest

## Example Operations

### Find Active Users

```json
{
  "operation": "find",
  "collection": "users",
  "query": "{\"status\": \"active\"}",
  "projection": "{\"name\": 1, \"email\": 1}",
  "sort": "{\"createdAt\": -1}",
  "limit": 10
}
```

### Insert New User

```json
{
  "operation": "insert",
  "collection": "users",
  "insertMode": "single",
  "document": "{\"name\": \"John Doe\", \"email\": \"john@example.com\", \"status\": \"active\"}"
}
```

### Update User Status

```json
{
  "operation": "update",
  "collection": "users",
  "updateMode": "updateMany",
  "filter": "{\"status\": \"pending\"}",
  "update": "{\"$set\": {\"status\": \"active\", \"updatedAt\": \"2023-01-01T00:00:00Z\"}}"
}
```

### Delete Inactive Users

```json
{
  "operation": "delete",
  "collection": "users",
  "deleteMode": "deleteMany",
  "deleteFilter": "{\"status\": \"inactive\", \"lastLogin\": {\"$lt\": \"2022-01-01T00:00:00Z\"}}"
}
```

### Aggregate User Statistics

```json
{
  "operation": "aggregate",
  "collection": "users",
  "pipeline": "[{\"$group\": {\"_id\": \"$status\", \"count\": {\"$sum\": 1}}}, {\"$sort\": {\"count\": -1}}]"
}
```

## Error Handling

The node supports the "Continue on Fail" setting:
- **Enabled**: Errors are returned as output data with error details
- **Disabled**: Errors stop the workflow execution

## Security Notes

- Always use strong authentication for production databases
- Enable SSL for remote connections
- Use MongoDB Atlas for managed, secure hosting
- Limit database user permissions to required operations only

## Troubleshooting

### Connection Issues

1. **Local MongoDB**: Ensure MongoDB service is running
2. **Atlas**: Check network access and IP whitelist
3. **Authentication**: Verify username/password and database permissions
4. **SSL**: Atlas requires SSL, local MongoDB typically doesn't

### Common Errors

- **ECONNREFUSED**: MongoDB server not running or wrong host/port
- **Authentication failed**: Invalid credentials
- **MongoServerSelectionError**: Network connectivity issues
- **Invalid JSON**: Check query, filter, or document syntax