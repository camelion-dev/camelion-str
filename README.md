# Camelion Store

A single Next.js App Router application for the Camelion storefront and admin operations dashboard.

## Current foundation

- Responsive editorial storefront at `/`
- Initial admin overview at `/admin`
- Tailwind CSS styling with a Camelion visual system
- PostgreSQL/Prisma domain schema in `prisma/schema.prisma`
- PKR pricing and COD order lifecycle utilities in `src/lib/`
- Environment contract in `.env.example`

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local`, then replace every Supabase placeholder with values from Supabase Dashboard > Project Settings > API and Database. Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

For Vercel, set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` in the project environment settings. Use a unique admin password with at least 16 characters and generate the signing secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Keep the service-role key and signing secret server-only. `DATABASE_URL` and `DIRECT_URL` are only needed for database tooling, not app runtime.

Credentials were present in prior Git commits. Before production, rotate the Supabase service-role key and database password, then update Vercel and local environment files. A private repository limits access to authorized collaborators but does not invalidate credentials already present in its history; do not rewrite shared history without coordinating with everyone who cloned it.

The database layer is designed for PostgreSQL through Supabase. `DATABASE_URL` should use the Supavisor transaction pooler on port `6543`; `DIRECT_URL` should use the direct/session connection on port `5432` for Prisma migrations.

Prisma is only used for schema tooling; install the patched development versions with:

```bash
npm install --save-dev --save-exact prisma@6.12.0 @prisma/client@6.12.0
npx prisma generate
```

Then create the Supabase tables from the existing Prisma schema:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev --name init
```

For a hosted deployment, apply the migration with `npx prisma migrate deploy`.

## Product search keywords

Before deploying changes that use product search keywords, run [`supabase/product_keywords.sql`](supabase/product_keywords.sql) in Supabase Dashboard > SQL Editor. It adds an optional `keywords` column to `Product`; existing rows remain valid without values. Admins can enter comma-separated alternate search terms when creating or editing a product.

## Product catalogue order

Before deploying product reordering, run [`supabase/catalog_order.sql`](supabase/catalog_order.sql) in Supabase Dashboard > SQL Editor. It adds the persistent `sortOrder` field, preserves the current newest-first catalogue order when first applied, and installs the admin-only database function used to save reordered products. The storefront's Featured order follows this field; the Newest option continues to sort by creation date.

## Detailed product descriptions

Before deploying rich product descriptions, run [`supabase/product_detailed_description.sql`](supabase/product_detailed_description.sql) in Supabase Dashboard > SQL Editor. It adds an optional formatted-description field without changing the existing short description. Product details entered in the admin are sanitized before storage and display.

## Checkout email addresses

Checkout requires a syntactically valid `@gmail.com` address. The order API normalizes it to lowercase, and the database enforces the Gmail domain with a check constraint. Apply [`supabase/orders_gmail_email.sql`](supabase/orders_gmail_email.sql) in Supabase Dashboard > SQL Editor before deploying this requirement to another environment.

## Supabase Storage

1. Open Supabase Dashboard > SQL Editor.
2. Run [`supabase/storage.sql`](supabase/storage.sql). It creates the public `product-images` bucket and public read policy.
3. Apply [`supabase/security_hardening.sql`](supabase/security_hardening.sql) after the order functions exist; it sets server-only RPC grants and creates the distributed request limiter.
4. Set `SUPABASE_STORAGE_BUCKET=product-images` in `.env.local`.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. The protected `/api/admin/product-images` route uses it to upload files.
6. Product uploads accept verified JPEG, PNG, and WebP files up to 4MB. The stored public URL and storage path are kept with the product record so the image can render in the storefront and be managed later.

## WhatsApp order confirmation

Set `WHATSAPP_PROVIDER_TOKEN` and the signing secret shown by the provider's Webhook settings as `WHATSAPP_WEBHOOK_SECRET`; both are server-only secrets in `.env.local` and deployment configuration. The checkout API sends a text confirmation request after the order has been committed; provider failures do not undo the order. The order remains `PENDING`, and the message asks the customer to reply `CONFIRM` or `CANCEL`. If that sender has multiple pending orders, include the order number in the reply to identify the intended order. After deploying to a public HTTPS domain, register `https://<your-production-domain>/api/whatsapp/webhook` in the provider dashboard or with `POST https://whatsapp.qasimhussain.com/api/webhook` and `{ "url": "https://<your-production-domain>/api/whatsapp/webhook" }`. The signed webhook checks the sender against the order phone, deduplicates provider message IDs, and permits only pending-order confirmation/cancellation. Cancellation restores stock once. Apply [`supabase/whatsapp_order_reply.sql`](supabase/whatsapp_order_reply.sql) to other environments before deploying the webhook code. The API token previously shared in chat should be revoked and replaced before configuring these variables.

The Prisma schema already includes `ProductImage` related to `Product`; the current local catalogue adapter mirrors the image URL/path fields until Prisma dependencies and a live database are configured.

## Product direction

Camelion v1 uses simple products, customer accounts, region-based delivery fees, inventory reservation at checkout, and cash on delivery. Product media is planned for Cloudinary and deployment for Vercel.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
