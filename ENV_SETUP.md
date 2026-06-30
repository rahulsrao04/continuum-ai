# Environment Variables Setup Guide

This document lists all environment variables required across the Continuum AI application (Backend, Frontend, and Extension) and where to obtain each value.

## Backend Environment Variables

### Required for Production (Render)

| Variable | Description | Where to Get | Security |
|----------|-------------|--------------|----------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Project Settings > API | Public |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (full access) | Supabase Dashboard > Project Settings > API | Secret |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (public access) | Supabase Dashboard > Project Settings > API | Public |
| `GROQ_API_KEY` | Groq API key for LLM calls | console.groq.com > API Keys | Secret |
| `FRONTEND_URL` | Frontend deployment URL | Your Vercel deployment URL | Public |
| `PORT` | Port for the server (Render sets this automatically) | Render provides this automatically | N/A |

### Optional for Development

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### How to Set Up in Render

1. Go to your Render dashboard
2. Select your web service
3. Go to Settings > Environment
4. Add each variable with its value

**Important:** Never commit the `SUPABASE_SERVICE_KEY` or `GROQ_API_KEY` to version control.

## Frontend Environment Variables

### Required for Production (Vercel)

| Variable | Description | Where to Get | Security |
|----------|-------------|--------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Project Settings > API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Project Settings > API | Public |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Your Render deployment URL | Public |

### Required for Development

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | (from .env.local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | (from .env.local) |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

### How to Set Up in Vercel

1. Go to your Vercel project dashboard
2. Go to Settings > Environment Variables
3. Add each variable with its value
4. Redeploy your project after adding variables

### Local Development

Create a `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Extension Environment Variables

### Required for Production

The extension uses hardcoded configuration in the source files. Before building for production, replace the placeholder:

**File:** `extension/utils/api.js`, `extension/popup/popup.js`, `extension/background.js`

Replace:
```javascript
const CONFIG = {
  API_URL: 'PRODUCTION_API_URL',
  // ...
};
```

With:
```javascript
const CONFIG = {
  API_URL: 'https://your-render-app.onrender.com',
  // ...
};
```

**File:** `extension/manifest.json`

Replace:
```json
"host_permissions": [
  "PRODUCTION_API_URL/*"
]
```

With:
```json
"host_permissions": [
  "https://your-render-app.onrender.com/*"
]
```

### Required for Development

For local development, use:
```javascript
const CONFIG = {
  API_URL: 'http://localhost:8000',
  // ...
};
```

## Where to Get Each Value

### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Create a new project
4. Go to Project Settings > API
5. Copy the following values:
   - **Project URL** → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY` (backend only, keep secret!)

### Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign in or create an account
3. Go to API Keys
4. Create a new API key
5. Copy the key → `GROQ_API_KEY` (backend only, keep secret!)

### Frontend URL (Vercel)

1. Deploy your frontend to Vercel
2. After deployment, Vercel will provide a URL like `https://your-project.vercel.app`
3. Copy this URL → `FRONTEND_URL` (backend) / `NEXT_PUBLIC_API_URL` (frontend)

### Backend URL (Render)

1. Deploy your backend to Render
2. After deployment, Render will provide a URL like `https://your-api.onrender.com`
3. Copy this URL → `NEXT_PUBLIC_API_URL` (frontend) / extension CONFIG

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env` files for local development
   - Add `.env` to `.gitignore`
   - Use platform-specific environment variable managers for production

2. **Use different keys for development and production**
   - Create separate Supabase projects for dev/prod
   - Use different Groq API keys if possible

3. **Rotate keys regularly**
   - Update API keys periodically
   - Revoke old keys after rotation

4. **Limit key permissions**
   - Use the least privileged key that works
   - Supabase anon key is safe for frontend
   - Service role key should only be used on backend

## Environment Variable Reference

### Backend (.env)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Groq
GROQ_API_KEY=your-groq-api-key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# Port (set by Render automatically)
PORT=8000
```

### Frontend (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

### Extension (hardcoded in source files)

```javascript
// Replace PRODUCTION_API_URL with actual URL
const CONFIG = {
  API_URL: 'https://your-api.onrender.com',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key'
};
```

## Testing Your Setup

After setting up environment variables, test each service:

### Backend Health Check
```bash
curl https://your-api.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Database Health Check
```bash
curl https://your-api.onrender.com/health/db
```

Expected response:
```json
{
  "status": "ok",
  "latency_ms": 45.23
}
```

### Groq Health Check
```bash
curl https://your-api.onrender.com/health/groq
```

Expected response:
```json
{
  "status": "ok",
  "latency_ms": 234.56
}
```

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your actual frontend URL
- Check that the URL includes the protocol (https://)
- Verify no trailing slashes in URLs

### Authentication Failures
- Verify Supabase keys are correct
- Check that service role key is used on backend only
- Ensure anon key is used on frontend

### Extension Connection Issues
- Verify the API URL in extension files matches your backend URL
- Check that the backend is accessible from the extension
- Ensure the extension has proper host permissions in manifest.json

### Rate Limiting
- If you see 429 errors, you've exceeded the rate limit (100 req/min)
- This is a safety feature to prevent abuse
- Will be upgraded to Redis-based rate limiting in production
