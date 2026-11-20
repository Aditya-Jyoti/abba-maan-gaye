# Ghumakkad (abba-maan-gaye)

An illustrated travel journal of India: a map of states visited, the trips within each state, and a long-form blog post for every stop. The goal is for posts to be edited in place on the site itself, with no separate CMS.

The original design is in [`design/plan.html`](design/plan.html), a Claude Design export you can open directly in a browser. Its unpacked source is in [`design/source/`](design/source/) for reference.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript), built as standalone output
- PostgreSQL 18 with [Drizzle ORM](https://orm.drizzle.team)
- Docker and Docker Compose for deployment

## Layout

```
src/app/            routes, layout, global styles, fonts and animations
src/app/(atlas)/    the site: / (India), /states/[stateId], /trips/[tripSlug]/[stopSlug]
src/components/     map views, the timeline transition and the post page
src/app/login/      editor login page
src/lib/            map geometry, database queries, date formatting
src/lib/auth/       passwords, sessions, login/logout actions
src/proxy.ts        sends visitors without a session from edit pages to /login
src/app/api/health  health check used by Docker (checks the database)
src/db/             database client and schema
src/data/           static data (India map geometry from the design)
drizzle/            generated SQL migrations
scripts/            migrate.mjs (run by the `migrate` container), seed.mjs, create-user.mjs
test/               unit tests (node --test)
public/fonts/       self-hosted Baloo 2 and Mukta
design/             original design export and its unpacked source
```

## Running with Docker

```bash
cp .env.example .env   # then set POSTGRES_PASSWORD
docker compose up -d --build
```

The site is at http://localhost:3000, and http://localhost:3000/api/health reports whether the database is reachable.

To load the sample trips from the design into an empty database:

```bash
docker compose run --rm migrate node scripts/seed.mjs           # skipped if trips exist
docker compose run --rm migrate node scripts/seed.mjs --reset   # replaces all trips
```

### Editor accounts

There is no public sign-up. Create an editor (you'll be asked for a password, at least 10 characters):

```bash
docker compose run --rm migrate node scripts/create-user.mjs you@example.com "Your Name"
docker compose run --rm migrate node scripts/create-user.mjs you@example.com --reset-password
```

Resetting a password also signs that editor out everywhere. Editors log in at `/login`; on a post they then get an **Edit** toggle, which opens `/trips/<trip>/<stop>/edit`. Edit pages redirect to the login page unless the session is valid.

Login cookies are marked `Secure` when your HTTPS proxy sends `X-Forwarded-Proto: https`. Set `COOKIE_SECURE=true` in `.env` to force it.

Compose starts three services:

| Service   | What it does |
| --------- | ------------ |
| `db`      | Postgres, data kept in the `pgdata` volume, port bound to `127.0.0.1` only |
| `migrate` | Applies pending migrations, then exits |
| `app`     | The Next.js server; starts once `migrate` succeeds. Uploaded photos are kept in the `media` volume |

Useful commands:

```bash
docker compose logs -f app       # follow app logs
docker compose up -d --build     # redeploy after pulling changes (migrations run automatically)
docker compose down              # stop (data is kept)
docker compose down -v           # stop and delete the database and photo volumes
```

To serve it on a domain, put a reverse proxy that handles HTTPS (Caddy, nginx, Traefik) in front of `APP_PORT`.

## Local development

Requires Node.js 20.12 or newer.

```bash
cp .env.example .env
npm install
docker compose up -d db   # just the database
npm run db:migrate
npm run db:seed           # sample trips from the design
npm run user:create -- you@example.com "Your Name"
npm run dev
```

## Database changes

1. Edit `src/db/schema.ts`.
2. Run `npm run db:generate` to write a new migration into `drizzle/`.
3. Run `npm run db:migrate` locally. Commit the migration; Docker applies it on the next deploy.

`npm run db:studio` opens Drizzle Studio for browsing the data.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
