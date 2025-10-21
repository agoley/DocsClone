# API-Only Deployment Guide

We've switched to an API-only deployment approach to ensure that your backend services are running smoothly without being blocked by client build issues. This document explains this approach and how to work with it.

## What is API-Only Mode?

API-only mode means that only your Express backend is deployed, without attempting to build and serve the React frontend. This approach:

1. Simplifies deployment by focusing on one part of the stack
2. Reduces build times and resource usage
3. Makes debugging easier by isolating backend issues
4. Provides a clear API documentation page at the root URL

## Current Configuration

Your `render.yaml` has been configured for API-only mode:

```yaml
services:
  - type: web
    name: documents-app-backend
    env: node
    repo: https://github.com/agoley/DocsClone
    branch: render-bootstrapping
    buildCommand: cd server && npm install
    startCommand: cd server && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: API_ONLY
        value: "true"
    plan: free
```

The `API_ONLY=true` environment variable tells the server to run in this specialized mode.

## How to Use API-Only Mode

### Accessing Your API

All API endpoints are available as normal:

- `POST /api/documents` - Create a new document
- `GET /api/documents/:id` - Retrieve document by ID
- Etc.

### Documentation Page

When you visit the root URL of your deployment, you'll see a documentation page that:

- Confirms the API is running
- Lists all available endpoints
- Provides basic information about each endpoint

### Testing the API

You can test your API using tools like:

1. **Postman**: Import the API collection and point it to your Render URL
2. **curl**: Run commands like `curl -X GET https://your-render-url.onrender.com/api/documents`
3. **Frontend development**: Connect your locally running React app to the deployed API

## Next Steps

Once you've confirmed your API is working correctly, you have several options:

### Option 1: Separate Frontend Deployment

Deploy your frontend separately on:

- Netlify
- Vercel
- GitHub Pages
- Another Render service

Configure the frontend to point to your API URL.

### Option 2: Full-Stack Deployment

When you're ready to try full-stack deployment again:

1. Remove the `API_ONLY` environment variable from render.yaml
2. Update the buildCommand to include client building:
   ```yaml
   buildCommand: cd client && npm install && npm run build && cd ../server && npm install
   ```
3. Test the deployment

### Option 3: Build Client Locally

If client building continues to fail in the deployment environment:

1. Build the client locally: `cd client && npm run build`
2. Copy the built files to your repository
3. Deploy with the pre-built client files

## Troubleshooting

If you encounter issues with the API-only deployment:

1. Check the server logs in your Render dashboard
2. Verify your database connection is working
3. Test API endpoints directly with tools like Postman
4. Ensure your environment variables are correctly set in Render
