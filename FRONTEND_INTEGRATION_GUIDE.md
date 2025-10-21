# Frontend Integration Guide

Now that your Documents API is successfully deployed at [https://docsclone-mu6c.onrender.com/](https://docsclone-mu6c.onrender.com/), this guide will help you connect a frontend application to it.

## Options for Frontend Deployment

You have several options for connecting a frontend to your API:

### Option 1: Local Development with Remote API

Run your React frontend locally while connecting to the deployed API:

1. Update your API service in `/client/src/services/api.js`:

```javascript
import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "https://docsclone-mu6c.onrender.com";

const api = axios.create({
  baseURL: API_URL,
});

// Rest of your API code...
```

2. Create a `.env.development` file in your `/client` directory:

```
REACT_APP_API_URL=https://docsclone-mu6c.onrender.com
```

3. Run your React app locally:

```bash
cd client
npm install
npm start
```

### Option 2: Deploy Frontend on Netlify/Vercel

1. Create a production build of your React app:

```bash
cd client
npm install
npm run build
```

2. Deploy the `/client/build` directory to Netlify or Vercel
3. Set the environment variable `REACT_APP_API_URL=https://docsclone-mu6c.onrender.com` in your deployment settings

### Option 3: Deploy Frontend on Render

1. Create a new Static Site service on Render
2. Connect to your GitHub repository
3. Set the following:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
   - Environment Variable: `REACT_APP_API_URL=https://docsclone-mu6c.onrender.com`

## Handling CORS

If you deploy your frontend on a different domain, you'll need to update your server to allow cross-origin requests:

1. Update your `/server/server.js` file:

```javascript
// In your server.js file, update the CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "https://your-frontend-domain.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
```

2. Redeploy your server after making these changes

## WebSocket Configuration

For real-time features, update the WebSocket connection in your frontend:

```javascript
// In /client/src/services/websocket.js
connect() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = process.env.REACT_APP_WS_URL ||
    `${wsProtocol}://docsclone-mu6c.onrender.com`;

  this.socket = new WebSocket(wsUrl);

  // Rest of your WebSocket code...
}
```

## Testing the Integration

After connecting your frontend to the API:

1. Test creating, reading, updating, and deleting documents
2. Verify that document sharing functionality works
3. Test real-time collaborative editing with multiple browser windows

## Troubleshooting

Common issues and solutions:

### CORS Errors

If you see errors like "Access to fetch at X from origin Y has been blocked by CORS policy":

1. Verify your CORS configuration in server.js
2. Make sure your frontend is using the full URL including `https://`
3. Check that your API URL doesn't have a trailing slash

### WebSocket Connection Issues

If real-time updates aren't working:

1. Check browser console for WebSocket errors
2. Verify your WebSocket URL is using the correct protocol (ws:// or wss://)
3. Ensure your Render service supports WebSocket connections

### API Connection Issues

If your frontend can't connect to the API:

1. Verify the API URL is correct in your environment variables
2. Try accessing the API directly in your browser to check if it's responsive
3. Check for any network blocking issues

## Going Back to Full-Stack Deployment

When you're ready to try full-stack deployment again:

1. Remove the `API_ONLY` environment variable from render.yaml
2. Update the buildCommand to include client building
3. Push changes and redeploy
