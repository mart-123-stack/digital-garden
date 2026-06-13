# GitHub OAuth Setup

## GitHub OAuth App

Create a GitHub OAuth App from GitHub Developer settings.

- Homepage URL: `http://47.86.212.91:3000`
- Authorization callback URL: `http://47.86.212.91:3000/api/auth/github/callback`

If a domain is later bound to the ECS server, update both values:

- Homepage URL: `https://your-domain.com`
- Authorization callback URL: `https://your-domain.com/api/auth/github/callback`

## Server Environment

On the ECS server:

```bash
cd /opt/digital-garden/app
nano .env
```

Set:

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_SITE_URL=http://47.86.212.91:3000
```

Restart the app:

```bash
docker compose up -d --build
```

## Quick Checks

```bash
curl -I http://47.86.212.91:3000/api/auth/github/start
docker compose logs --tail=80 app
```

Expected behavior:

- If env is configured, `/api/auth/github/start` redirects to `https://github.com/login/oauth/authorize`.
- If env is missing, it redirects back to `/login?error=github_oauth_not_configured`.
