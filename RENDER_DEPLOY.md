# Render Deployment Guide

This guide explains how to securely deploy your application on Render without exposing sensitive credentials.

## Setting Up Environment Variables in Render

1. Log in to your Render dashboard at [dashboard.render.com](https://dashboard.render.com)
2. Select your web service for the backend
3. Go to the "Environment" tab
4. Add the following environment variables:

   - `NODE_ENV`: Set to `production`
   - `PORT`: Render automatically sets this, but you can specify `10000` as a fallback
   - `RENDER_POSTGRES_URL`: This will be automatically set if you're using Render's PostgreSQL service. If not, you'll need to add it manually in the format: `postgres://username:password@host:port/database_name`

   If you're not using the `RENDER_POSTGRES_URL`, you'll need to add these variables individually:
   - `DB_HOST`: Your PostgreSQL host
   - `DB_PORT`: Your PostgreSQL port (typically 5432)
   - `DB_NAME`: Your database name
   - `DB_USER`: Your database username
   - `DB_PASSWORD`: Your database password

5. Click "Save Changes"

## Connecting to Render PostgreSQL Service

If you're using Render's PostgreSQL service:

1. Go to your PostgreSQL service in the Render dashboard
2. Under the "Info" section, you'll find the "Connection" details
3. Copy the "Internal Database URL" - this is the secure URL your services can use within Render
4. Add this as the `RENDER_POSTGRES_URL` environment variable in your web service

## Security Best Practices

1. **Never commit `.env` files**: Keep your `.env` file in `.gitignore`
2. **Use environment variables**: All sensitive credentials should be stored as environment variables
3. **Use connection strings**: For production, use the provided connection string from Render
4. **Rotate credentials**: Periodically update your database passwords
5. **Limit database user permissions**: Create database users with only the permissions they need

## Verify Deployment

After deploying, check your Render logs to ensure the application is connecting to the database successfully. You should see:

```
Using Render PostgreSQL connection string
Connected to PostgreSQL database
```

If you encounter connection issues, verify your environment variables and make sure your database service is running.