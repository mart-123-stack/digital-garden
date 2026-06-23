# 🚀 Little Prince Digital Garden

<div align="center">
  <h3>一座正在醒来的个人宇宙</h3>
  <p>A poetic personal universe for notes, essays, games, and memory.</p>

  <br>
  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL 16">
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" alt="Docker Compose">
  </p>
</div>

---

## ✨ Overview

A personal knowledge base website inspired by **The Little Prince**. Navigate between planets in a starry universe — each planet is a section of your digital garden: blog, notes, about page, profile, and mini-games.

The entire experience is built around a spaceship cursor, parallax starfield, and orbital planet navigation powered by Framer Motion.

---

## 🪐 Features

### 🌟 Interactive Planet Navigation
- **Cover → Map transition**: Enter the universe through a warp-gate animation
- **5 planets**: Profile, Blog, About Me, Notes, Game — each with unique visual design
- **Magnetic effect**: Planets subtly follow your cursor movement
- **Day/night toggle**: Click the About Me planet's streetlamp to switch

### 🚀 Spaceship Cursor
- Custom SVG spaceship that follows mouse with spring physics
- Rotates toward movement direction; flame trail during acceleration
- Auto-hidden on touch devices

### ✍️ Blog System
- Markdown rendering with code syntax highlighting
- Full-text search via PostgreSQL tsvector + trigram indexes
- Tag filtering, RSS feed (`/feed.xml`), sitemap (`/sitemap.xml`)

### 📝 Knowledge Notes
- Ring-based visual layout (asteroid belt style)
- Status lifecycle: seedling → budding → evergreen
- Cluster filtering: PKM, Interface, Writing, Systems, Life

### 🎮 Mini Games
- 4 toy games: Star Catcher, Logic Bot, UFO Dodge, Color Blocks
- Leaderboard with score persistence

### ⭐ Engagement System
- Like / favorite reactions on posts and notes
- Star points with daily caps per action type
- Pet system with XP and level progression

### 🔐 Authentication
- Credential-based login (scrypt password hashing)
- JWT sessions (7-day expiry)
- GitHub OAuth support
- Admin role for content management

### 🛠️ Admin Studio
- CRUD for posts, notes, and about profile
- Markdown editor with live preview
- Image upload (max 8MB)

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5.7 |
| **Animation** | Framer Motion 12 |
| **Styling** | Tailwind CSS 3.4 |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (jose) + scrypt |
| **Markdown** | react-markdown + rehype + remark |
| **Container** | Docker Compose |
| **Deploy** | Alibaba Cloud ECS, GitHub Actions |

---

## 📁 Project Structure

```
little-prince-digital-garden/
├── app/
│   ├── page.tsx              # Homepage (planet map)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles & animations
│   ├── blog/                 # Blog pages
│   ├── notes/                # Notes pages
│   ├── about/                # About page
│   ├── profile/              # User profile
│   ├── game/                 # Mini games
│   ├── admin/                # Content management
│   ├── login/ & register/    # Auth pages
│   ├── feed.xml/             # RSS feed
│   ├── sitemap.ts            # Sitemap
│   └── api/                  # RESTful API routes
├── components/
│   ├── CosmicShell.tsx       # Parallax starfield background
│   ├── SpaceshipCursor.tsx   # Custom cursor
│   ├── AuthDock.tsx          # Login/logout UI
│   ├── ContentEngagement.tsx # Likes, favorites, comments
│   └── MarkdownRenderer.tsx  # Markdown with code highlighting
├── lib/
│   ├── auth.ts               # JWT sign/verify, login/register
│   ├── auth-context.tsx       # Client-side auth provider
│   ├── db.ts                 # PostgreSQL connection pool
│   ├── password.ts           # scrypt hashing
│   ├── points.ts             # Star points & pet system
│   └── slug.ts               # Slug generation
├── migrations/
│   └── init.sql              # Database schema
├── mcp/                      # Model Context Protocol server
├── scripts/                  # Migration & seed scripts
├── docker-compose.yml        # App + DB + Caddy + MCP
└── Dockerfile                # Multi-stage Next.js build
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or Docker)
- npm

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/mart-123-stack/digital-garden.git
cd digital-garden
npm install

# 2. Start PostgreSQL (Docker)
docker compose up db -d

# 3. Copy environment variables
cp .env.example .env

# 4. Run database migrations
npm run db:migrate

# 5. Seed admin user
npm run db:seed-admin

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production (Docker Compose)

```bash
docker compose up -d
```

---

## 🗄️ API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/posts` | GET, POST | List / create blog posts |
| `/api/posts/[slug]` | GET, PUT, DELETE | Single post CRUD |
| `/api/notes` | GET, POST | List / create notes |
| `/api/notes/[slug]` | GET, PUT, DELETE | Single note CRUD |
| `/api/comments` | GET, POST | Comments |
| `/api/reactions` | GET, POST | Like / favorite |
| `/api/profile` | GET, PUT | User profile |
| `/api/profile/stats` | GET | User stats & pet |
| `/api/game/score` | GET, POST | Game scores & leaderboard |
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Register |
| `/api/auth/github` | GET | GitHub OAuth flow |
| `/api/upload` | POST | Image upload |

---

## 🤖 MCP Server

The project includes a Model Context Protocol (MCP) server for AI-assisted content management:

```bash
docker compose up mcp-server -d
```

Available tools:
- `garden_list_posts` / `garden_get_post` / `garden_create_post` / `garden_update_post` / `garden_delete_post`
- `garden_list_notes` / `garden_get_note` / `garden_create_note` / `garden_update_note` / `garden_delete_note`
- `garden_get_stats` / `garden_get_profile_stats`
- `garden_list_comments` / `garden_get_pet`

---

## 📄 License

MIT
