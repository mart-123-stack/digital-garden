# Digital Garden Deployment

## Current Production

- ECS host: `47.86.212.91`
- App URL: `http://47.86.212.91:3000`
- App directory: `/opt/digital-garden/app`
- App container port: `3000`
- MCP server port: `3100`

## GitHub Actions Secrets

Set these in GitHub repository settings:

| Secret | Example | Purpose |
| --- | --- | --- |
| `ECS_HOST` | `47.86.212.91` | ECS public IP or domain |
| `ECS_USER` | `root` | SSH user |
| `ECS_SSH_KEY` | OpenSSH private key | Deploy key for SSH |
| `COMPOSE_PROFILES` | `proxy` | Optional. Use `proxy` after domain DNS is ready |

The workflow is `.github/workflows/deploy.yml`. It runs `npm ci`, `npm run build`, builds the MCP server, then SSHes into ECS and runs `scripts/deploy-ecs.sh`.

## Server `.env`

Create `/opt/digital-garden/app/.env` on ECS:

```env
POSTGRES_USER=garden
POSTGRES_PASSWORD=replace-with-strong-password
POSTGRES_DB=digital_garden
JWT_SECRET=replace-with-long-random-secret
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=replace-with-strong-admin-password
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_SITE_URL=http://47.86.212.91:3000
SITE_DOMAIN=example.com
ACME_EMAIL=your-email@example.com
```

When a real domain is ready, change `NEXT_PUBLIC_SITE_URL` to `https://example.com`.

## IP Deployment

Use this before the domain is configured:

```bash
cd /opt/digital-garden/app
docker compose up -d --build
```

Visit:

```text
http://47.86.212.91:3000
```

## Domain And HTTPS Deployment

1. In your domain provider, add an `A` record:

```text
@     A     47.86.212.91
www   A     47.86.212.91
```

2. Open ECS security group ports:

```text
80/tcp
443/tcp
3000/tcp optional for direct debugging
3100/tcp optional for MCP access
```

3. Update server `.env`:

```env
NEXT_PUBLIC_SITE_URL=https://example.com
SITE_DOMAIN=example.com
ACME_EMAIL=your-email@example.com
```

4. Start with the proxy profile:

```bash
cd /opt/digital-garden/app
docker compose --profile proxy up -d --build
```

Caddy will request and renew HTTPS certificates automatically.

## GitHub OAuth Callback

After binding a domain, update the GitHub OAuth app:

```text
Homepage URL: https://example.com
Authorization callback URL: https://example.com/api/auth/github/callback
```

## Health Checks

```bash
docker compose ps
docker compose logs --tail=100 app
docker compose --profile proxy logs --tail=100 caddy
curl -I http://47.86.212.91:3000
curl -I https://example.com
```
