# API Testing Guide for DocsClone

This guide provides examples of how to test each endpoint of your Documents API, which is now successfully deployed at [https://docsclone-mu6c.onrender.com/](https://docsclone-mu6c.onrender.com/).

## Prerequisites

You'll need one of the following tools to test the API:

- [Postman](https://www.postman.com/downloads/) (Recommended for comprehensive testing)
- [curl](https://curl.se/) (Command-line tool for quick tests)
- Any API testing tool of your choice

## Base URL

All examples use the following base URL:

```
https://docsclone-mu6c.onrender.com
```

## Document Management Endpoints

### 1. Create a New Document

**Endpoint:** `POST /api/documents`

**Using curl:**

```bash
curl -X POST \
  https://docsclone-mu6c.onrender.com/api/documents \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "My First Document",
    "content": "This is the content of my first document."
}'
```

**Expected Response:**

```json
{
  "id": 1,
  "title": "My First Document",
  "content": "This is the content of my first document.",
  "created_at": "2025-10-21T12:00:00.000Z",
  "updated_at": "2025-10-21T12:00:00.000Z",
  "share_id": null
}
```

### 2. Get All Documents

**Endpoint:** `GET /api/documents`

**Using curl:**

```bash
curl -X GET https://docsclone-mu6c.onrender.com/api/documents
```

**Expected Response:**

```json
[
  {
    "id": 1,
    "title": "My First Document",
    "created_at": "2025-10-21T12:00:00.000Z",
    "updated_at": "2025-10-21T12:00:00.000Z"
  }
]
```

### 3. Get Document by ID

**Endpoint:** `GET /api/documents/:id`

**Using curl:**

```bash
curl -X GET https://docsclone-mu6c.onrender.com/api/documents/1
```

**Expected Response:**

```json
{
  "id": 1,
  "title": "My First Document",
  "content": "This is the content of my first document.",
  "created_at": "2025-10-21T12:00:00.000Z",
  "updated_at": "2025-10-21T12:00:00.000Z",
  "share_id": null
}
```

### 4. Update a Document

**Endpoint:** `PUT /api/documents/:id`

**Using curl:**

```bash
curl -X PUT \
  https://docsclone-mu6c.onrender.com/api/documents/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated Document Title",
    "content": "This content has been updated."
}'
```

**Expected Response:**

```json
{
  "id": 1,
  "title": "Updated Document Title",
  "content": "This content has been updated.",
  "created_at": "2025-10-21T12:00:00.000Z",
  "updated_at": "2025-10-21T12:30:00.000Z",
  "share_id": null
}
```

### 5. Delete a Document

**Endpoint:** `DELETE /api/documents/:id`

**Using curl:**

```bash
curl -X DELETE https://docsclone-mu6c.onrender.com/api/documents/1
```

**Expected Response:**

```json
{
  "message": "Document deleted successfully"
}
```

## Document Sharing Endpoints

### 1. Generate Share ID

**Endpoint:** `POST /api/documents/:id/share`

**Using curl:**

```bash
curl -X POST https://docsclone-mu6c.onrender.com/api/documents/1/share
```

**Expected Response:**

```json
{
  "id": 1,
  "shareId": "550e8400-e29b-41d4-a716-446655440000",
  "shareUrl": "https://docsclone-mu6c.onrender.com/shared/550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Get Share URL

**Endpoint:** `GET /api/documents/:id/share-url`

**Using curl:**

```bash
curl -X GET https://docsclone-mu6c.onrender.com/api/documents/1/share-url
```

**Expected Response:**

```json
{
  "id": 1,
  "shareId": "550e8400-e29b-41d4-a716-446655440000",
  "shareUrl": "https://docsclone-mu6c.onrender.com/shared/550e8400-e29b-41d4-a716-446655440000"
}
```

### 3. Get Shared Document

**Endpoint:** `GET /api/documents/shared/:shareId`

**Using curl:**

```bash
curl -X GET https://docsclone-mu6c.onrender.com/api/documents/shared/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response:**

```json
{
  "id": 1,
  "title": "Updated Document Title",
  "content": "This content has been updated.",
  "createdAt": "2025-10-21T12:00:00.000Z",
  "updatedAt": "2025-10-21T12:30:00.000Z"
}
```

## Troubleshooting

If you encounter any issues while testing:

1. **404 Not Found**: Verify you're using the correct endpoint path
2. **500 Internal Server Error**: Check the Render logs for backend errors
3. **Database Issues**: Ensure your Render PostgreSQL service is properly connected
4. **Authentication Issues**: This API doesn't currently implement authentication

## Next Steps

Once you've verified all API endpoints are working correctly, you can:

1. Build a frontend that connects to this API
2. Implement user authentication
3. Add more features to the document management system
