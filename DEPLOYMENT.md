# Deployment Guide for Vercel

This guide will walk you through deploying your Suno Assistant app to Vercel.

## Prerequisites

- A GitHub account (to connect your repository)
- A Vercel account (free tier is sufficient)
- Your API keys ready (Anthropic or OpenAI)

## Step-by-Step Deployment

### 1. Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (easiest option)
4. Authorize Vercel to access your GitHub account

### 2. Push Your Code to GitHub

Make sure your code is pushed to GitHub on the branch: `claude/deploy-static-server-011CUxFCXvTdBL4gJ7NpKQgh`

```bash
git add .
git commit -m "feat: Configure for Vercel deployment"
git push -u origin claude/deploy-static-server-011CUxFCXvTdBL4gJ7NpKQgh
```

### 3. Import Project to Vercel

1. Log in to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Find your repository `matjosoft/suno-assistant`
4. Click "Import"

### 4. Configure Build Settings

Vercel will automatically detect Next.js. You should see:

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `.next` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

Click "Deploy" to proceed.

### 5. Add Environment Variables

**IMPORTANT**: Before your first deployment works, you need to add environment variables.

After clicking deploy (or in project settings):

1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the following variables:

   **If using Anthropic Claude:**
   - `AI_PROVIDER` = `anthropic`
   - `ANTHROPIC_API_KEY` = `your_actual_api_key_here`

   **If using OpenAI:**
   - `AI_PROVIDER` = `openai`
   - `OPENAI_API_KEY` = `your_actual_api_key_here`
   - `OPENAI_MODEL` = `gpt-4-turbo-preview` (optional)

4. Click "Save"
5. Redeploy the project (Settings → Deployments → click on latest deployment → "Redeploy")

### 6. Access Your App

Once deployment is complete:

1. You'll see a success message with a URL like: `https://your-project-name.vercel.app`
2. Click the URL to open your deployed app
3. Test the functionality to make sure it works!

## Custom Domain (Optional)

To use your own domain (e.g., `suno.matjosoft.se`):

1. Go to project "Settings" → "Domains"
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update your domain's DNS records with your hosting provider

## Automatic Deployments

Vercel will automatically redeploy your app whenever you push to your GitHub repository. This means:

- Push to GitHub → Automatic deployment
- No manual deployment needed after initial setup

## Environment Variables Security

- Your API keys are stored securely in Vercel
- They are NOT exposed in the browser
- They are only accessible server-side in your API routes

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Make sure TypeScript types are correct

### App Loads But API Doesn't Work
- Check environment variables are set correctly
- Verify API keys are valid
- Check function logs in Vercel dashboard (Deployments → View Function Logs)

### Need Help?
- Check [Vercel Documentation](https://vercel.com/docs)
- View deployment logs in your Vercel dashboard

## Testing Locally Before Deployment

To test the production build locally:

```bash
npm run build
npm start
```

This simulates how the app will run on Vercel.

## Cost

Vercel's **Hobby (Free) plan** includes:
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Serverless function executions

This is more than sufficient for testing and moderate usage.
