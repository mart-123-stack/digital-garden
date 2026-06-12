# Digital Garden Fullstack Migration Plan

## Assumptions

- Current project keeps the Next.js App Router frontend and evolves into a fullstack app.
- Production target is an Alibaba Cloud server running Docker Compose first, not Kubernetes.
- PostgreSQL is the system of record for posts, notes, comments, users, points, pets, and game scores.
- The old repository is used as a reference implementation, not copied wholesale, because this project is on Next 15 and has a different visual architecture.

## Execution Order

1. **Foundation**: Docker, PostgreSQL schema, env contract, deployment-ready standalone build.
2. **Backend Core**: database client, auth helpers, post/note/comment/reaction APIs.
3. **Auth UI**: credential login first, GitHub OAuth after the base session model is stable.
4. **Admin Studio**: Markdown editor, image upload, blog/note CRUD.
5. **Profile Editing**: user avatar/name/bio/interests, visitor license connected to real user data.
6. **Star Points + Pets**: daily caps, game score rewards, leaderboard, pet egg and upgrades.
7. **MCP Server**: tools for listing, searching, creating, updating posts/notes and reading stats.
8. **CI/CD**: GitHub Actions build, Docker image push, SSH deploy to Alibaba Cloud.

## Database Scope Added In Step 1

- `users`: login identity, OAuth provider, role, editable profile fields.
- `posts` and `notes`: Markdown content with publish state.
- `comments`: threaded comments for posts and notes.
- `reactions`: likes and favorites.
- `media_assets`: uploaded image metadata.
- `about_profile`: editable site owner profile.
- `game_scores`: game leaderboard.
- `star_points_ledger`: capped gamification points.
- `pets`: one star pet per user, starting from a free egg.

## Local Database Commands

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
2. Run migrations:

```bash
npm run db:migrate
```

3. Seed or update the administrator account:

```bash
npm run db:seed-admin
```

4. Start the app:

```bash
npm run dev
```

## Completed So Far

- Docker, PostgreSQL schema, env contract, and standalone Next.js build.
- Database/auth/points helpers.
- API routes for auth, posts, notes, comments, reactions, profile, upload, and game scores.
- Login/register/profile UI.
- Admin Studio for Markdown Blog and Notes editing with image upload.

## Next Step

Connect the public Blog and Notes pages to the database-backed APIs, then add comment/reaction UI around each piece of content.
