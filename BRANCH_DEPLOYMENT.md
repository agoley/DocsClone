# Branch-Based Deployments on Render

This guide explains how to set up and manage deployments from different branches in your repository with Render.

## Configuring Branch-Based Deployments

### Using render.yaml (Infrastructure as Code)

The `render.yaml` file in your repository has been configured to use the `render-bootstrapping` branch for deployment:

```yaml
services:
  - type: web
    name: documents-app-backend
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && node server.js
    branch: render-bootstrapping # Specific branch to deploy from
    envVars:
      - key: NODE_ENV
        value: production
    plan: free
```

### Manual Configuration in Render Dashboard

Alternatively, you can specify which branch to deploy from in the Render dashboard:

1. Navigate to your Web Service in the Render dashboard
2. Go to the "Settings" tab
3. Under "Build & Deploy", find the "Branch" field
4. Enter the name of the branch you want to deploy from (e.g., `render-bootstrapping`)
5. Click "Save Changes"

## Setting Up Branch-Specific Preview Environments

Render also supports automatic preview deployments for different branches:

1. Navigate to your Web Service in the Render dashboard
2. Go to the "Settings" tab
3. Under "Preview Environments", enable "Pull Request Previews" or "Branch Previews"
4. For Pull Request Previews, select which branches to generate previews for
5. For Branch Previews, specify which branches should have preview environments

This lets you maintain multiple environments (production, staging, testing) based on different branches in your repository.

## Promoting Between Environments

To promote code between environments (e.g., from staging to production):

1. Test thoroughly in your staging environment (e.g., `render-bootstrapping` branch)
2. Merge the changes to your production branch (e.g., `main` or `master`)
3. Render will automatically deploy the changes to your production environment

## Best Practices

1. **Production vs. Development**: Use separate branches for production (stable code) and development (work in progress)
2. **Feature Branches**: Create feature branches for new features, then merge them into your development branch
3. **Environment Variables**: Set environment-specific variables for different branches (e.g., database URLs)
4. **Testing**: Always test in a staging environment before deploying to production

## Current Configuration

Your current setup uses the `render-bootstrapping` branch for deployment. When you're ready to move to production:

1. Merge `render-bootstrapping` into your main branch
2. Update the `branch` field in `render.yaml` to point to your main branch
3. Push the changes

Alternatively, you can maintain separate services for different branches (e.g., production vs. staging).
