# Frontend 404 Troubleshooting Guide

## Current Issue

Getting 404 errors when accessing `https://docsclone-1.onrender.com/documents/1`

## Possible Causes & Solutions

### 1. Static Site Configuration Issue

The render.yaml might not be correctly configured for static sites.

**Solution**: Deploy frontend manually as a Static Site:

1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Connect to your GitHub repo (agoley/DocsClone)
4. Configure:
   - Branch: `render-bootstrapping`
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
   - Environment Variables:
     - `REACT_APP_API_URL`: `https://docsclone-mu6c.onrender.com`
     - `NODE_ENV`: `production`

### 2. \_redirects File Not Working

The `_redirects` file might not be in the correct location or format.

**Current location**: `/client/public/_redirects`
**Content**: `/*    /index.html   200`

**Alternative solution**: Add to package.json build script:

```json
{
  "scripts": {
    "build": "react-scripts build && echo '/*    /index.html   200' > build/_redirects"
  }
}
```

### 3. Blueprint Deployment Issues

The render.yaml Blueprint deployment might not be working correctly.

**Solution**: Delete the current frontend service and recreate manually.

### 4. React Router Configuration

There might be an issue with React Router setup.

**Test**: Visit these URLs to debug:

- `https://docsclone-1.onrender.com/` (should work)
- `https://docsclone-1.onrender.com/debug` (should work)
- `https://docsclone-1.onrender.com/invalid-route` (should show 404 page)

## Immediate Steps to Try:

### Step 1: Manual Static Site Deployment

1. In Render Dashboard, create a new Static Site
2. Use the configuration above
3. Deploy and test

### Step 2: Update Build Script (if manual deployment doesn't work)

Add the \_redirects file to the build process:

In `/client/package.json`:

```json
{
  "scripts": {
    "build": "react-scripts build && echo '/*    /index.html   200' > build/_redirects"
  }
}
```

### Step 3: Test URLs Systematically

1. Root URL
2. Debug URL
3. Document URL
4. Invalid URL (to see 404 handler)

## Debugging Commands

After deployment, check these:

1. **Check if \_redirects file is in build**:
   Look in the deployed site's file structure

2. **Check browser Network tab**:
   See what HTTP status codes are returned

3. **Check Render deployment logs**:
   Look for build errors or warnings

## Expected Behavior

- `/` → Shows DocumentList component
- `/documents/1` → Shows DocumentEditor component (if document exists)
- `/debug` → Shows ApiDebugger component
- `/invalid-route` → Shows custom 404 page

## If All Else Fails

Deploy frontend to a different service:

- Netlify
- Vercel
- GitHub Pages

These services have better support for React Router SPAs.
