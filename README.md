# North West Nitro - Netlify edition

A standard Next.js app with PostgreSQL persistence and Supabase email-code authentication. The original Sites/Cloudflare preview remains in the sibling `north-west-nitro` directory.

## Set up services

1. Create a PostgreSQL database (Netlify Database or a hosted PostgreSQL provider). Use a serverless-compatible pooled connection URL with certificate verification. Do not disable TLS verification. This application uses the server-only `pg` driver.
2. Create a Supabase project for authentication. Enable email sign-in. In Authentication > Email templates > Magic Link, use `{{ .Token }}` as the sign-in code rather than a magic-link URL. Configure a production SMTP sender and appropriate auth rate limits before launch; the built-in testing sender is not suitable for public club registration.
3. Copy `.env.example` to `.env.local`, fill in values locally, and add the same values to Netlify's environment settings for Functions. `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SITE_URL` are required. Use the publishable/anon key, never a Supabase service-role key. Do not paste secrets into chat or GitHub.
4. Set Supabase Site URL to the actual Netlify site URL, and later your club domain. Sign-in uses codes entered on the website, not callback links. The site verifies every session with Supabase before granting permissions. Request headers cannot grant administrator access.

## Database and data transfer

Run `node --env-file=.env.local scripts/migrate.mjs` once against the intended database before first use. It applies the versioned PostgreSQL schema in a transaction; reruns are safe. Migrations are explicit, not part of builds, so deploy previews cannot silently alter production data. Give previews separate database and authentication settings.

To migrate local D1 data, stop writes and back up the original SQLite database. Select the correct SQLite file under the original project's `.wrangler/state/v3/d1` directory (do not use the test database):

```
python scripts/export-local.py ABSOLUTE_SQLITE_PATH PRIVATE_EXPORT_PATH.json
node --env-file=.env.local scripts/import-data.mjs PRIVATE_EXPORT_PATH.json
```

Import requires empty target tables and rolls back on failure. Never put the JSON export in Git. Hosted Sites data is separate: export it separately before choosing the authoritative source. Do not blindly merge local/test data with real memberships. No data has been exported or uploaded by this conversion.

Existing member IDs are retained. A verified email reconnects members to their previous membership and bookings. Legacy guest entries are matched by verified email. Review duplicate email/account histories before launch. Temporary import previews are not migrated. Existing permissions are retained; the main administrator is adzharding@yahoo.co.uk, with adzsenpai@gmail.com initially enabled as the additional administrator.

## Netlify deployment

Connect this GitHub repository to Netlify. Build command: `npm run build`; publish directory: `.next`; Node: 22 (configured in netlify.toml). Netlify supplies its Next.js adapter automatically. Do not use a static folder upload: the app needs server functions.

After adding environment settings and applying the schema, deploy and test at the Netlify URL. Sign in with an administrator email using a real verification code. Check registration, approval, member-number assignment, discounted entry prices, series/events, cash payments and results imports. Then connect northwestnitro.com and follow Netlify's DNS instructions, preserving existing email records.

## Development and checks

`npm ci`, `npm run dev` (port 5174), `npm run build`, and `npm test`.

Real email sign-in and full server operations require configured services. No mock admin login exists in this edition. The original local preview stays on port 5173.

## Payments

Cash works independently of Stripe. Leave Stripe settings blank until ready. For online payments set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the exact HTTPS `SITE_URL`; configure Stripe's webhook to `/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.expired`. Only then enable payments in club administration. Do not put production payment secrets in deploy previews.

## Deployment status

Code preparation and local checks do not provision services or publish the website. Production database, SMTP/auth configuration, data transfer and end-to-end deployed checks remain necessary before launch.
