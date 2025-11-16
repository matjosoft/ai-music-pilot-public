# Deployment Guide for Vercel with Supabase

This guide will walk you through deploying your AI Music Pilot app (with Supabase authentication and database) to Vercel.

## Prerequisites

- A GitHub account
- A Vercel account (free tier is sufficient)
- A Supabase account (free tier is sufficient)
- Your API keys ready (Anthropic or OpenAI)

## Part 1: Set Up Supabase

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub
4. Create a new project:
   - **Organization**: Choose or create one
   - **Project Name**: `ai-music-pilot` (or any name you prefer)
   - **Database Password**: Generate a strong password (save it somewhere safe!)
   - **Region**: Choose closest to your target users
5. Click "Create new project"
6. Wait 2-3 minutes for the project to initialize

### 2. Run Database Migrations

Your project includes database migrations in the `supabase/migrations/` folder. You have two options:

#### Option A: Using Supabase Dashboard (Easiest)

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql` from your repository
3. Paste into the SQL Editor and click "Run"
4. Repeat for `supabase/migrations/002_rename_projects_to_songs.sql`

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these two values (you'll need them for Vercel):
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### 4. Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email settings or use Supabase's default SMTP for testing
4. Optionally enable other providers (Google, GitHub, etc.)

## Part 2: Deploy to Vercel

### 1. Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 2. Push Your Code to GitHub

Ensure your code is pushed to GitHub on the branch: `claude/prepare-for-launch-011CUvnSa5vUBMi5SDr5Lvq2`

```bash
git add .
git commit -m "feat: Ready for deployment with Supabase"
git push -u origin claude/prepare-for-launch-011CUvnSa5vUBMi5SDr5Lvq2
```

### 3. Import Project to Vercel

1. Log in to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Find your repository `matjosoft/suno-assistant`
4. Click "Import"
5. If asked about branch, select the appropriate branch

### 4. Configure Build Settings

Vercel will automatically detect Next.js:

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `.next` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

**Do NOT click "Deploy" yet!** First, add environment variables.

### 5. Add Environment Variables

Click "Environment Variables" section and add ALL of these:

#### AI Provider Configuration

**If using Anthropic Claude:**
- Name: `AI_PROVIDER` → Value: `anthropic`
- Name: `ANTHROPIC_API_KEY` → Value: `your_actual_anthropic_api_key`

**If using OpenAI:**
- Name: `AI_PROVIDER` → Value: `openai`
- Name: `OPENAI_API_KEY` → Value: `your_actual_openai_api_key`
- Name: `OPENAI_MODEL` → Value: `gpt-4-turbo-preview` (optional)

#### Supabase Configuration (Required)

- Name: `NEXT_PUBLIC_SUPABASE_URL` → Value: `https://xxxxx.supabase.co` (from Supabase settings)
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Value: `your_anon_key` (from Supabase settings)

**IMPORTANT**: Make sure these are set for **all environments** (Production, Preview, Development)

### 6. Configure Authentication Redirect URLs

After your first deployment, you'll get a Vercel URL (e.g., `https://ai-music-pilot.vercel.app`)

1. Go back to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add these patterns:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**`
     - `http://localhost:3000/**` (for local development)

### 7. Deploy!

1. Click "Deploy" in Vercel
2. Wait 2-3 minutes for the build to complete
3. You'll see a success message with your live URL

### 8. Test Your Deployment

1. Visit your deployed URL (e.g., `https://ai-music-pilot.vercel.app`)
2. Test the following:
   - Click "Sign In" - you should be able to create an account
   - After signing in, create a song
   - Go to Dashboard - you should see your saved songs
   - Test regenerate lyrics and metatags
   - Test delete functionality

## Custom Domain (Optional)

To use your own domain (e.g., `suno.matjosoft.se`):

1. Go to Vercel project "Settings" → "Domains"
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update your domain's DNS records with your hosting provider
5. **Don't forget**: Add the custom domain to Supabase redirect URLs!

## Automatic Deployments

Vercel will automatically redeploy whenever you push to your GitHub branch:

- Push to GitHub → Automatic deployment
- No manual deployment needed

## Environment Variables Summary

Here's a quick checklist of all required environment variables:

**AI Provider (choose one):**
- ✓ `AI_PROVIDER`
- ✓ `ANTHROPIC_API_KEY` (if using Anthropic)
- ✓ `OPENAI_API_KEY` (if using OpenAI)

**Supabase (required):**
- ✓ `NEXT_PUBLIC_SUPABASE_URL`
- ✓ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript types are correct

### App Loads But API Doesn't Work
- Check environment variables are set correctly
- Verify AI API keys are valid
- Check function logs in Vercel (Deployments → View Function Logs)

### Authentication Not Working
- Verify Supabase redirect URLs include your Vercel domain
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check Supabase auth logs (Authentication → Logs)

### Songs Not Saving
- Verify database migrations ran successfully
- Check Supabase Table Editor to see if tables exist
- Check Vercel function logs for database errors

### Local Development

To run locally with Supabase:

1. Copy `.env.example` to `.env.local`
2. Fill in all environment variables
3. Run:
```bash
npm install
npm run dev
```

## Security Notes

- API keys are stored securely in Vercel (server-side only)
- Supabase anon key is safe to expose (it has Row Level Security)
- Never commit `.env` or `.env.local` files to Git

## Cost

**Vercel Hobby (Free) plan** includes:
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Serverless function executions

**Supabase Free plan** includes:
- 50,000 monthly active users
- 500MB database storage
- 1GB file storage
- 2GB bandwidth

This is sufficient for testing and moderate usage.

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- Check deployment and function logs in respective dashboards
