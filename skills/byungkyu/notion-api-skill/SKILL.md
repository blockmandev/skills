---
name: notion
description: |
  Notion API integration with managed OAuth. Query databases, create and update pages, manage blocks. Use this skill when users want to interact with Notion workspaces, databases, or pages.
compatibility: Requires network access and valid Maton API key
metadata:
  author: maton
  version: "1.0"
---

# Notion

Access the Notion API with managed OAuth authentication. Query databases, create pages, manage blocks, and search your workspace.

## Quick Start

```bash
# Search for pages
curl -s -X POST 'https://gateway.maton.ai/notion/v1/search' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Notion-Version: 2025-09-03' \
  -d '{"query": "meeting notes"}'
```

## Base URL

```
https://gateway.maton.ai/notion/v1/{endpoint}
```

The gateway proxies requests to `api.notion.com` and automatically injects your OAuth token.

## Required Headers

All Notion API requests require the version header:

```
Notion-Version: 2025-09-03
```

## Authentication

All requests require the Maton API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

**Environment Variable:** Set your API key as `MATON_API_KEY`:

```bash
export MATON_API_KEY="YOUR_API_KEY"
```

### Getting Your API Key

1. Sign in at [maton.ai](https://maton.ai)
2. Go to [maton.ai/settings](https://maton.ai/settings)
3. Copy your API key

## Connection Management

Manage your Notion OAuth connections at `https://ctrl.maton.ai`.

### List Connections

```bash
curl -s -X GET 'https://ctrl.maton.ai/connections?app=notion&status=ACTIVE' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

### Create Connection

```bash
curl -s -X POST 'https://ctrl.maton.ai/connections' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{"app": "notion"}'
```

### Get Connection

```bash
curl -s -X GET 'https://ctrl.maton.ai/connections/{connection_id}' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

**List Connections Response:**
```json
{
  "connections": [
    {
      "connection_id": "21fd90f9-5935-43cd-b6c8-bde9d915ca80",
      "status": "ACTIVE",
      "url": "https://connect.maton.ai/?session_token=...",
      "app": "notion"
    }
  ]
}
```

**Get Single Connection Response:**
```json
{
  "connection": {
    "connection_id": "21fd90f9-5935-43cd-b6c8-bde9d915ca80",
    "status": "ACTIVE",
    "url": "https://connect.maton.ai/?session_token=...",
    "app": "notion"
  }
}
```

Open the returned `url` in a browser to complete OAuth authorization.

### Delete Connection

```bash
curl -s -X DELETE 'https://ctrl.maton.ai/connections/{connection_id}' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

## Key Concept: Databases vs Data Sources

In API version 2025-09-03, databases and data sources are separate:

| Concept | Use For |
|---------|---------|
| **Database** | Creating databases, getting data source IDs |
| **Data Source** | Querying, updating schema, updating properties |

Use `GET /databases/{id}` to get the `data_sources` array, then use `/data_sources/` endpoints:

```json
{
  "object": "database",
  "id": "abc123",
  "data_sources": [
    {"id": "def456", "name": "My Database"}
  ]
}
```

## API Reference

### Search

Search for pages:

```bash
POST /notion/v1/search
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "query": "meeting notes",
  "filter": {"property": "object", "value": "page"}
}
```

Search for data sources:

```bash
POST /notion/v1/search
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "filter": {"property": "object", "value": "data_source"}
}
```

### Data Sources

#### Get Data Source

```bash
GET /notion/v1/data_sources/{dataSourceId}
Notion-Version: 2025-09-03
```

#### Query Data Source

```bash
POST /notion/v1/data_sources/{dataSourceId}/query
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "filter": {
    "property": "Status",
    "select": {"equals": "Active"}
  },
  "sorts": [
    {"property": "Created", "direction": "descending"}
  ],
  "page_size": 100
}
```

#### Update Data Source

```bash
PATCH /notion/v1/data_sources/{dataSourceId}
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "title": [{"type": "text", "text": {"content": "Updated Title"}}],
  "properties": {
    "NewColumn": {"rich_text": {}}
  }
}
```

### Databases

#### Get Database

```bash
GET /notion/v1/databases/{databaseId}
Notion-Version: 2025-09-03
```

#### Create Database

```bash
POST /notion/v1/databases
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "parent": {"type": "page_id", "page_id": "PARENT_PAGE_ID"},
  "title": [{"type": "text", "text": {"content": "New Database"}}],
  "properties": {
    "Name": {"title": {}},
    "Status": {"select": {"options": [{"name": "Active"}, {"name": "Done"}]}}
  }
}
```

### Pages

#### Get Page

```bash
GET /notion/v1/pages/{pageId}
Notion-Version: 2025-09-03
```

#### Create Page

```bash
POST /notion/v1/pages
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "parent": {"page_id": "PARENT_PAGE_ID"},
  "properties": {
    "title": {"title": [{"text": {"content": "New Page"}}]}
  }
}
```

#### Create Page in Data Source

```bash
POST /notion/v1/pages
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "parent": {"data_source_id": "DATA_SOURCE_ID"},
  "properties": {
    "Name": {"title": [{"text": {"content": "New Page"}}]},
    "Status": {"select": {"name": "Active"}}
  }
}
```

#### Update Page Properties

```bash
PATCH /notion/v1/pages/{pageId}
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "properties": {
    "Status": {"select": {"name": "Done"}}
  }
}
```

#### Update Page Icon

```bash
PATCH /notion/v1/pages/{pageId}
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "icon": {"type": "emoji", "emoji": "🚀"}
}
```

#### Archive Page

```bash
PATCH /notion/v1/pages/{pageId}
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "archived": true
}
```

### Blocks

#### Get Block Children

```bash
GET /notion/v1/blocks/{blockId}/children
Notion-Version: 2025-09-03
```

#### Append Block Children

```bash
PATCH /notion/v1/blocks/{blockId}/children
Content-Type: application/json
Notion-Version: 2025-09-03

{
  "children": [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{"type": "text", "text": {"content": "New paragraph"}}]
      }
    }
  ]
}
```

#### Delete Block

```bash
DELETE /notion/v1/blocks/{blockId}
Notion-Version: 2025-09-03
```

### Users

#### List Users

```bash
GET /notion/v1/users
Notion-Version: 2025-09-03
```

#### Get Current User

```bash
GET /notion/v1/users/me
Notion-Version: 2025-09-03
```

## Filter Operators

- `equals`, `does_not_equal`
- `contains`, `does_not_contain`
- `starts_with`, `ends_with`
- `is_empty`, `is_not_empty`
- `greater_than`, `less_than`

## Block Types

- `paragraph`, `heading_1`, `heading_2`, `heading_3`
- `bulleted_list_item`, `numbered_list_item`
- `to_do`, `code`, `quote`, `divider`

## Code Examples

### JavaScript

```javascript
const response = await fetch('https://gateway.maton.ai/notion/v1/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.MATON_API_KEY}`,
    'Notion-Version': '2025-09-03'
  },
  body: JSON.stringify({ query: 'meeting' })
});
```

### Python

```python
import os
import requests

response = requests.post(
    'https://gateway.maton.ai/notion/v1/search',
    headers={
        'Authorization': f'Bearer {os.environ["MATON_API_KEY"]}',
        'Notion-Version': '2025-09-03'
    },
    json={'query': 'meeting'}
)
```

## Notes

- All IDs are UUIDs (with or without hyphens)
- Use `GET /databases/{id}` to get the `data_sources` array containing data source IDs
- Creating databases requires `POST /databases` endpoint
- Delete blocks returns the block with `archived: true`

## Error Handling

| Status | Meaning |
|--------|---------|
| 400 | Missing Notion connection |
| 401 | Invalid or missing Maton API key |
| 429 | Rate limited (10 req/sec per account) |
| 4xx/5xx | Passthrough error from Notion API |

## Resources

- [Notion API Introduction](https://developers.notion.com/reference/intro)
- [Search](https://developers.notion.com/reference/post-search.md)
- [Query Database](https://developers.notion.com/reference/post-database-query.md)
- [Get Page](https://developers.notion.com/reference/retrieve-a-page.md)
- [Create Page](https://developers.notion.com/reference/post-page.md)
- [Update Page](https://developers.notion.com/reference/patch-page.md)
- [Append Block Children](https://developers.notion.com/reference/patch-block-children.md)
- [Filter Reference](https://developers.notion.com/reference/post-database-query-filter.md)
- [LLM Reference](https://developers.notion.com/llms.txt)
