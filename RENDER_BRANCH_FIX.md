# Fixing Render Branch Deployment Issues

If Render is still deploying from the main branch despite having a render.yaml configuration specifying another branch, follow these steps to resolve the issue:

## Option 1: Delete and Recreate the Service (Recommended)

The most reliable way to fix branch issues is to delete the current service and recreate it:

1. In the Render dashboard, navigate to your service
2. Click on "Settings"
3. Scroll to the bottom and click "Delete Service"
4. Create a new service:
   - Click "New +" > "Web Service"
   - Connect your GitHub repository
   - **IMPORTANT:** Choose "Use render.yaml from the repo"
   - Confirm that the settings match what's in your render.yaml file
   - Click "Create Web Service"

This ensures that Render uses your render.yaml configuration from scratch without any cached settings.

## Option 2: Manual Branch Override

If you prefer not to recreate the service:

1. In the Render dashboard, navigate to your service
2. Click on "Settings"
3. Under "Build & Deploy" section, find the "Branch" field
4. **Delete any existing branch name** and type "render-bootstrapping"
5. Click "Save Changes"
6. Manually trigger a new deployment

## Option 3: Blueprint Settings

If you used a Blueprint to create your services:

1. Go to the Render dashboard
2. Click on "Blueprints" in the left sidebar
3. Find your blueprint and click on it
4. Click "Settings"
5. Update the branch name to "render-bootstrapping"
6. Click "Save Changes"
7. Click "Apply Changes" to update all services

## Verify Your Configuration

After making these changes:

1. Go to your service in the Render dashboard
2. Click on the "Logs" tab
3. Look for a message similar to "Pulling code from GitHub: branch 'render-bootstrapping'"
4. If you still see it pulling from main, contact Render support with your issue

## GitHub Repository Settings

Make sure your GitHub repository is properly configured:

1. Make sure the "render-bootstrapping" branch exists on GitHub (not just locally)
2. Verify you have pushed all your changes to this branch
3. Check that the branch protection rules (if any) don't prevent Render from accessing it

These steps should resolve any issues with Render deploying from the wrong branch.
