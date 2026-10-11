# DimV Community — Foundation v0.1.0

React + TypeScript + Vite frontend, Supabase client, initial database schema, and Netlify SPA configuration.

## What works in this foundation
- Responsive dark/blue login and workspace UI.
- Discord OAuth sign-in button using Supabase Auth.
- Session restoration and sign-out.
- Navigation shell for planned tool pages.
- Basic `profiles`, memberships, products, promo, transactions, token wallet, usage logs, and settings schema with RLS enabled.
- Netlify build configuration and SPA redirects.

## What is not implemented yet
The tool processing engines, real checkout/payment provider, Discord bot/role sync, admin/owner management UI, secure promo redemption, and automated expiry jobs are not active. The dashboard intentionally labels these areas as pending rather than pretending they work.

## Run locally
1. Install Node.js 20+ on a computer or use a browser IDE that supports Node projects.
2. Copy `.env.example` to `.env.local`.
3. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Project Settings > API.
4. In the project folder run:
   ```sh
   npm install
   npm run dev
   ```
5. Open the local URL shown by Vite.

Do not put the Supabase `service_role` key in `.env.local`, frontend source, or Netlify variables prefixed with `VITE_`.

## Configure Supabase
1. Create a new Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication > Providers, enable Discord and configure the Discord OAuth Client ID and Secret from your Discord Developer Portal.
4. In Authentication > URL Configuration, set the Site URL to your deployed Netlify URL and add allowed redirect URLs for local development and production, for example:
   - `http://localhost:5173`
   - `https://YOUR-SITE.netlify.app`
5. Set the `.env.local` values for local use. In Netlify, add the same two public frontend environment variables and redeploy.

The Discord provider configuration and callback URL must match the values shown by Supabase Auth provider settings. Do not use a Discord client secret in frontend code.

## Create GitHub repository and deploy from Android
1. Download and extract this ZIP on your device.
2. Create a new GitHub repository named `dimv-community` (do not initialize it with a README if you plan to upload these files as-is).
3. Upload the extracted project files/folders to the repository root. GitHub mobile/browser upload supports selecting files; if folder upload is unavailable on your device, use GitHub's web editor or a browser IDE such as GitHub Codespaces.
4. In Netlify, choose Add new site / Import an existing project and connect the new GitHub repository.
5. Build command: `npm run build`; publish directory: `dist`. `netlify.toml` already contains these values.
6. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables, then deploy.

## Security notes
- Frontend variables prefixed `VITE_` are public. Only put the Supabase project URL and publishable/anon key there.
- The schema intentionally does not allow client-side role changes or public reads of promo-code definitions.
- Never trust prices, promo discounts, membership expiry, token balances, or payment status supplied by the browser. Fulfillment must be verified server-side.
- Before production, implement and test server-side promo redemption, payment webhooks, entitlement checks, and role administration.
