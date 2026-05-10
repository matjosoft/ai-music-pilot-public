# AI Music Pilot
Your AI Co-Pilot for Music Creation - Navigate your music journey with AI-powered lyrics, prompts, and metatags for Suno AI

## Features

- Generate music projects with lyrics, style descriptions, and metatags for Suno AI
- Regenerate lyrics with custom instructions
- Regenerate metatags for dynamic arrangements
- Support for both Anthropic Claude and OpenAI GPT models

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Choose Your AI Provider

The application supports both **Anthropic Claude** and **OpenAI GPT** models. Configure your `.env` file based on your preferred provider:

#### Option A: Using Anthropic Claude (Default)

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key from: https://console.anthropic.com/

#### Option B: Using OpenAI GPT

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
```

Get your API key from: https://platform.openai.com/api-keys


**Note:** GPT-5 and newer models (o1, o3) automatically use the `max_completion_tokens` parameter instead of `max_tokens`.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `openai` | AI provider to use: `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | Yes (if using Anthropic) | - | Your Anthropic API key |
| `OPENAI_API_KEY` | Yes (if using OpenAI) | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-5-mini` | OpenAI model to use |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | - | Your Supabase project URL (from project settings) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | - | Your Supabase anonymous key (from project settings) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | - | Your Supabase service role key - **CRITICAL** for usage tracking and subscriptions |

### Supabase Configuration

All three Supabase environment variables are **required** for the application to function properly:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Get these from your [Supabase project settings](https://app.supabase.com/project/_/settings/api)
- `SUPABASE_SERVICE_ROLE_KEY`: Also available in project settings under "service_role key"
  - ⚠️ **WARNING**: This key bypasses Row-Level Security. Never expose it to the client or commit it to version control!
  - This key is essential for server-side operations like logging usage and managing subscriptions
  - **Without this key, the song counter will not decrease after generation** due to failed usage logging

## Build for Production

```bash
npm run build
npm start
```
