# affiliate-project

Dealora is a database-first affiliate commerce platform with a dynamic Next.js storefront, an editorial admin studio, and a secured Express/Prisma API. Products, stores, brands, categories, promotions, navigation, footer content, and homepage sections are managed in PostgreSQL—not hardcoded in React.

## Quick start

1. Copy `.env.example` to `.env` and configure PostgreSQL.
2. Run `npm install`.
3. Run `npm run db:generate && npm run db:push && npm run db:seed`.
4. Start both services with `npm run dev:all`.

The storefront runs at `http://localhost:3000`, the API at `http://localhost:4000`, and the content studio at `http://localhost:3000/admin`.

## Architecture

- `app/` — Next.js App Router storefront and admin UI
- `server/` — Express REST API, authentication, validation, and security middleware
- `prisma/` — PostgreSQL relational schema and environment-driven admin seed

No demo catalog data is included. Create the first admin using environment variables, then publish real content through the studio/API.
