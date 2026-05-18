# Paddock Parts

Mobile-first trackside emergency parts network for motorcycle track day riders, club racers, teams, shops, vendors, and fabricators.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, RLS, and Storage-ready schema

## Local Development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app includes seeded demo data so the MVP flows work before Supabase credentials are connected.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## MVP Coverage

- Garage bike profiles and installed parts
- Spare parts inventory with event visibility
- Track event check-in, visible paddock inventory, riders, and urgent requests
- Emergency crash flow with zone checklist, safety language, rules-plus-tags matching, and request posting
- Request responses and resolved status
- Initial printable-file data model for later fabrication support

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm build
```
