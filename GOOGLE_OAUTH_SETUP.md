# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for your AI Music Pilot app.

## Prerequisites

- Access to your Supabase project dashboard
- A Google Cloud Platform account

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project for your app
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** for user type (unless you have a Google Workspace)
   - Fill in the required app information:
     - App name: `AI Music Pilot`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes (recommended):
     - `userinfo.email`
     - `userinfo.profile`
   - Add test users if in testing mode
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `AI Music Pilot Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-production-domain.com/auth/callback` (for production)
     - `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase callback)
7. Click **CREATE**
8. Copy your **Client ID** and **Client Secret** (you'll need these for Supabase)

## Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list of providers
5. Enable the Google provider
6. Enter the credentials from Google Cloud Console:
   - **Client ID**: Paste the Client ID from Step 1
   - **Client Secret**: Paste the Client Secret from Step 1
7. Click **Save**

## Step 3: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set the following URLs:
   - **Site URL**: `https://your-production-domain.com` (or `http://localhost:3000` for development)
   - **Redirect URLs**: Add these URLs (one per line):
     ```
     http://localhost:3000/**
     https://your-production-domain.com/**
     ```

## Step 4: Verify Environment Variables

Ensure your `.env.local` file contains the Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Test the Google OAuth Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. You should see the login page with:
   - Email/Password fields
   - **"Continue with Google"** button

4. Click the Google button and follow the OAuth flow:
   - Select your Google account
   - Grant permissions
   - You should be redirected back to `/create` page after successful authentication

## Deployment Notes

### For Vercel Deployment:

1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. After deployment, get your Vercel URL (e.g., `https://ai-music-pilot.vercel.app`)

3. Update Google Cloud Console:
   - Add your Vercel URL to **Authorized JavaScript origins**
   - Add `https://your-app.vercel.app/auth/callback` to **Authorized redirect URIs**

4. Update Supabase:
   - Set Site URL to your Vercel URL
   - Add `https://your-app.vercel.app/**` to Redirect URLs

## Troubleshooting

### "redirect_uri_mismatch" Error
- Verify all redirect URIs are correctly configured in Google Cloud Console
- Check that Supabase callback URL is included: `https://<project-ref>.supabase.co/auth/v1/callback`
- Ensure no trailing slashes in URLs

### OAuth Not Working in Production
- Verify environment variables are set in Vercel
- Check that production domain is added to Google OAuth origins
- Confirm Supabase Site URL matches your production domain

### "Invalid OAuth Client" Error
- Verify Client ID and Client Secret in Supabase match Google Cloud Console
- Check that OAuth consent screen is published (not in draft)
- Ensure test users are added if app is in testing mode

## Security Best Practices

1. **Never commit OAuth secrets** to version control
2. **Use environment variables** for all sensitive credentials
3. **Regularly rotate** Client Secrets
4. **Limit redirect URIs** to only trusted domains
5. **Review OAuth scopes** - only request necessary permissions

## Additional Resources

- [Supabase Google OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
