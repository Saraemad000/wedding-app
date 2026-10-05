# Forever Wedding Invitation

A React + TypeScript + Vite wedding invitation site with motion-driven sections, a live countdown, gallery, music, RSVP, and guest wishes.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Start the app:

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Supabase tables

Use the SQL in `supabase/schema.sql` to create:

- `guest_wishes`
- `rsvp_responses`

with public insert policies and approved-only read policies.

## Production deployment

This project is configured for Vercel through `vercel.json`.

When deploying, add the same environment variables in the Vercel project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not expose the Supabase service-role key in the client.

## Social sharing metadata

The site includes open graph and Twitter metadata in `index.html`, plus `/og-image.svg` and `/favicon.svg` assets for a professional shared preview.
