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
OPENAI_MODEL=gpt-4-turbo-preview
```

Get your API key from: https://platform.openai.com/api-keys

**Available OpenAI Models:**
- `gpt-4-turbo-preview` (recommended)
- `gpt-4`
- `gpt-3.5-turbo`
- `gpt-5-preview` (supports newer API features)
- `o1`, `o3` (reasoning models)

**Note:** GPT-5 and newer models (o1, o3) automatically use the `max_completion_tokens` parameter instead of `max_tokens`.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `anthropic` | AI provider to use: `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | Yes (if using Anthropic) | - | Your Anthropic API key |
| `OPENAI_API_KEY` | Yes (if using OpenAI) | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4-turbo-preview` | OpenAI model to use |

## Build for Production

```bash
npm run build
npm start
```
