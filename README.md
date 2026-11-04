# Dxlea Printing Hub

A secure, mobile-friendly web application for **Dxlea Printing Services** built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase.

Designed specifically for print shop counter operations, allowing walk-in customers to scan a QR code from mobile data or Wi-Fi, upload files directly to cloud storage, configure print parameters, and receive a secure pickup ticket.

---

## Shop Operational Workflow

1. **Store Poster**: The shop displays a printed poster with a QR code generated from the Admin Station.
2. **Customer Self-Service**: A customer scans the poster QR on their phone (via mobile data or Wi-Fi), selects print options (service type, paper size, color, binding), and uploads files (JPG, PNG, WEBP, HEIC, PDF).
3. **Pickup Ticket**: Upon submission, the customer receives an instant Pickup Ticket showing their short human-readable Order Number (e.g., `PRT-20261104-A1B2`) and a secure receipt QR code (`/receipt/<public_token>`).
4. **Counter Fulfillment**: Counter staff scans the customer's receipt QR or types the order number into the live Admin Station to immediately inspect specifications and download print-ready files.

---

## Security & Architecture Highlights

- **Admin Authentication & RBAC**: Supabase Auth with server-verified sessions stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies. Middleware-protected `/admin` routes and server-side `requireAdmin` defense in depth. Restricted to emails listed in `ADMIN_EMAILS`.
- **Order Privacy**: 128-bit unguessable base64url `public_token` for customer receipt access. Public endpoints return masked phone numbers (e.g. `0946****772`) and scrub sensitive operational fields.
- **Server-Side Pricing**: Prices and rush fees recomputed strictly on the server from specifications; client-tampered totals are ignored.
- **Direct-to-Storage Uploads**: Bypasses serverless body limits (Netlify 6 MB limit) using signed upload URLs directly to Supabase Storage, with magic-byte file signature verification on confirmation.
- **Configurable Site URL**: Single canonical `NEXT_PUBLIC_SITE_URL` for all storefront and receipt QR codes. Production safety refuses localhost/private LAN addresses (`192.168.x`).
- **Free-Tier Storage Management**: Admin storage dashboard with 1 GB quota tracking and one-click cleanup for files of completed/cancelled orders and abandoned uploads.

---

## Free-Tier Deployment Guide (Netlify + Supabase)

Dxlea Printing Hub runs completely free on the combination of **Netlify Free Tier** and **Supabase Free Tier**.

### Step 1: Supabase Setup

1. Create a free account and new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard and run the migrations in order:
   - `supabase/migrations/001_customer_order_privacy.sql`
   - `supabase/migrations/002_storage_hardening.sql`
3. Configure Authentication:
   - Navigate to **Authentication** -> **Providers** -> **Email**.
   - **IMPORTANT**: Disable public sign-ups by turning off **"Enable Signup"**. This ensures only accounts created by the shop administrator can log in.
   - Navigate to **Authentication** -> **Users** and click **Add User** -> **Create User** to create accounts for shop staff.
4. Retrieve API Keys:
   - Navigate to **Project Settings** -> **API**.
   - Copy the `Project URL`, `anon public` key, and `service_role secret` key.

> [!NOTE]
> **Supabase Free Tier Inactivity Pause**:
> Supabase pauses free-tier projects after 7 days of complete inactivity. If paused, log into your Supabase Dashboard and click **Restore project** (takes ~1-2 minutes).
> **Storage Quota**: The free tier includes **1 GB** of file storage. Use the built-in Storage Management tool in the Admin Dashboard to prune old files. Free tier does not include point-in-time recovery.

---

### Step 2: Netlify Deployment

1. Push your repository to GitHub or GitLab.
2. Log into [netlify.com](https://netlify.com) and click **Add new site** -> **Import an existing project**.
3. Select your repository. Netlify will detect Next.js automatically:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - Node version `20.17.0` is pinned automatically via `netlify.toml`.
4. Configure **Environment Variables** in Netlify (**Site configuration** -> **Environment variables**):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret | `eyJhbGciOi...` |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Storage bucket name | `order-files` |
| `ADMIN_EMAILS` | Comma-separated staff emails | `owner@dxleaprinting.com,staff@dxleaprinting.com` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (NO trailing slash) | `https://dxlea-printing.netlify.app` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size per file (MB) | `10` |
| `STORAGE_WARNING_THRESHOLD_PERCENT` | Storage alert threshold (%) | `80` |
| `ALLOW_DEMO_DATA` | Enable seed orders in production | `false` |

5. Click **Deploy Site**.
6. Once deployed, note your assigned domain (or configure a custom domain under **Domain management**).
7. If your site URL changes (e.g. from `xyz.netlify.app` to a custom domain), update `NEXT_PUBLIC_SITE_URL` in Netlify's environment variables and trigger a redeploy so all poster and receipt QR codes use the new address.

> [!NOTE]
> **Netlify Free Tier Quota**:
> Netlify provides **300 build minutes** per month. Subsequent production builds use Next.js caching to stay well within limits.
> HTTPS is enabled and enforced automatically by Netlify.

---

### Step 3: Printing the Storefront Poster

1. Open your deployed site's admin station: `https://your-domain.netlify.app/admin/dashboard`
2. Log in using your Supabase staff credentials.
3. Click **Storefront Poster** in the header.
4. Verify the previewed URL matches `https://your-domain.netlify.app`.
   - *Note: In production mode, the modal will block generation and warn you if `NEXT_PUBLIC_SITE_URL` is unset or points to a private address (such as `192.168.x.x`).*
5. Click **Download QR as PNG** for a 512x512 high-resolution image with quiet margins (ideal for Canva, Photoshop, or laminators), or click **Print Poster** to print directly from your browser.

---

### Step 4: Storage Maintenance & Cleanup

To keep your storage well within Supabase's 1 GB free tier:

1. Click the **Storage** button in the Admin Station header.
2. The panel displays current file count, MB used, and percentage of the 1 GB quota.
3. When nearing capacity (or at any time), click **Clean up files**:
   - Choose file retention (7, 14, 30, or 60 days).
   - Confirms deletion of files belonging to `COMPLETED` and `CANCELLED` orders older than the selected retention period.
   - Cleans up abandoned uploads older than 24 hours.
   - Order records, customer details, and price histories are permanently preserved, and cleaned files display a clean `"File removed (Cleaned up)"` status badge in order details.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in Supabase credentials
cp .env.example .env.local

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

