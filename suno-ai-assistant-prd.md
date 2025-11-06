# Suno AI Music Assistant - Product Requirements Document

## Project Overview

A web application that helps users create better music with Suno AI by generating intelligent prompts, lyrics with metatags, and style descriptions optimized for Suno's Custom Mode.

### Target Platform
- Deployment: Vercel
- Framework: Next.js 14+ (App Router)
- AI Provider: Anthropic Claude API (claude-sonnet-4-20250514)

---

## Core Value Proposition

The app solves the problem of creating effective Suno prompts by:
1. Generating structured lyrics with intelligent metatags describing instrumentation per section
2. Creating detailed style descriptions optimized for Suno
3. Allowing easy editing and regeneration of specific sections
4. Providing two separate outputs ready to copy-paste into Suno Custom Mode

---

## MVP Feature Scope

### 1. Project Creation Flow

**User Input:**
- Free-text vision/description of desired music
- Genre selection (dropdown)
- Mood selection (dropdown)
- Tempo selection (dropdown)

**AI Generation:**
The app generates a complete music project with:
- Lyrics with intelligent metatags per section
- Style description (comma-separated)
- Section breakdown with instrumentation details

### 2. Intelligent Metatags

Metatags describe the musical arrangement for each section and guide Suno's production.

**Format:** `[Section: instrumentation and production details]`

**Examples:**
```
[Intro: acoustic guitar, soft piano]
[Verse 1: stripped back, vocals and acoustic guitar only]
[Pre-Chorus: add drums, build-up]
[Chorus: full band, electric guitar, powerful drums, energetic vocals]
[Bridge: guitar solo, no vocals, heavy drums]
[Outro: fade out, ambient synths]
```

**Metatag Components:**
- **Instruments:** acoustic guitar, electric bass, 808 drums, synth pads, piano, etc.
- **Vocal instructions:** no vocals, whispered vocals, powerful vocals, harmonies, soft vocals
- **Dynamics:** stripped back, full band, build-up, fade out, fade in
- **Technical:** reverb heavy, distorted, clean, lo-fi, ambient

**Section-Specific Patterns:**
- **Intro:** Usually instrumental, 1-2 instruments, fade in, atmospheric
- **Verse:** Stripped back, focus on vocals and storytelling, limited instrumentation
- **Pre-Chorus:** Build-up, gradually add instruments, crescendo
- **Chorus:** Full band, all instruments, powerful vocals, maximum energy
- **Bridge:** Contrast to verses/chorus, often instrumental breaks or solos, no vocals common
- **Outro:** Fade out or ending, reduced instrumentation, resolution

### 3. Two-Field Output (Suno Custom Mode Format)

The app outputs two separate fields that can be copied independently:

**Field 1: Lyrics (Song Description)**
```
[Intro: acoustic guitar, soft piano]
[Instrumental]

[Verse 1: acoustic guitar, gentle vocals]
Walking down the empty street
Shadows dancing at my feet
...

[Chorus: full band, electric guitar, powerful vocals]
We rise, we fall, we try again
...
```

**Field 2: Style of Music**
```
indie rock, melancholic, electric guitar, bass, drums, synthesizer pads, 
female vocals, emotional delivery, alto range, reverb, atmospheric, 
90 bpm, minor key
```

### 4. Interactive Editing

Users can:
- Copy lyrics to clipboard (with success feedback)
- Copy style to clipboard (with success feedback)
- Regenerate all lyrics
- Regenerate all metatags (keeping lyrics but updating arrangement instructions)
- Regenerate style description
- Edit lyrics manually (future: inline editing)
- Edit individual metatags through a visual editor (future)

### 5. Local Storage

For MVP, projects are saved in browser localStorage:
- No backend database required
- Projects persist across sessions
- Simple JSON structure
- Easy to implement and fast

---

## Technical Architecture

### Tech Stack

```yaml
Frontend Framework: Next.js 14+ (App Router, TypeScript)
Styling: Tailwind CSS
UI Components: shadcn/ui (optional, or plain Tailwind)
AI Integration: Anthropic Claude API
State Management: React hooks (useState, useEffect) + Context API
Storage: localStorage (MVP)
Deployment: Vercel
```

### Project Structure

```
suno-ai-assistant/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing/home page
│   ├── create/
│   │   └── page.tsx               # Project creation page
│   ├── project/
│   │   └── [id]/
│   │       └── page.tsx           # Project view/edit page
│   └── api/
│       ├── generate/
│       │   └── route.ts           # POST: Generate complete project
│       ├── regenerate/
│       │   └── route.ts           # POST: Regenerate specific section
│       └── regenerate-metatags/
│           └── route.ts           # POST: Regenerate all metatags
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── ProjectForm.tsx            # Initial project creation form
│   ├── CustomModeOutput.tsx       # Two-field output with copy buttons
│   ├── LyricsEditor.tsx           # Lyrics display and editing
│   ├── StyleEditor.tsx            # Style display and editing
│   ├── MetaTagEditor.tsx          # Visual metatag editor (future)
│   └── SunoInstructions.tsx       # Help component
├── lib/
│   ├── anthropic.ts               # Claude API client
│   ├── prompts.ts                 # System and user prompt templates
│   ├── storage.ts                 # localStorage utilities
│   ├── metatag-suggestions.ts     # Smart metatag generation logic
│   └── utils.ts                   # Helper functions
├── types/
│   └── index.ts                   # TypeScript type definitions
├── .env.local                     # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

### Environment Variables

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

---

## API Routes Specification

### POST /api/generate

Generates a complete music project from user input.

**Request Body:**
```typescript
{
  vision: string;      // User's description
  genre: string;       // Selected genre
  mood: string;        // Selected mood
  tempo: string;       // Selected tempo
}
```

**Response:**
```typescript
{
  lyrics: string;      // Complete lyrics with metatags
  style: string;       // Comma-separated style description
  sections: Array<{
    section: string;   // "Intro", "Verse 1", etc.
    metatag: string;   // "[Intro: acoustic guitar, soft piano]"
    lyrics: string;    // Lyrics for this section
  }>;
  suggestions: string; // Tips for the user
}
```

**Implementation Notes:**
- Use Claude API with model: `claude-sonnet-4-20250514`
- Max tokens: 4000
- Include system prompt defining metatag rules
- Parse JSON response from Claude
- Handle errors gracefully

### POST /api/regenerate

Regenerates a specific section of lyrics while maintaining consistency.

**Request Body:**
```typescript
{
  section: string;        // Section to regenerate
  currentLyrics: string;  // Full current lyrics for context
  instructions: string;   // User's regeneration instructions
  style: string;         // Current style for consistency
}
```

**Response:**
```typescript
{
  section: string;
  metatag: string;
  lyrics: string;
}
```

### POST /api/regenerate-metatags

Regenerates all metatags while keeping lyrics unchanged.

**Request Body:**
```typescript
{
  lyrics: string;  // Current lyrics
  style: string;   // Current style
}
```

**Response:**
```typescript
{
  sections: Array<{
    section: string;
    metatag: string;
    reasoning: string;
  }>;
}
```

---

## AI Prompting Strategy

### System Prompt

```
You are an expert at creating detailed music projects for Suno AI Custom Mode.

Your task is to take the user's vision and generate:
1. Complete lyrics with intelligent metatag structure
2. Detailed style description for the "Style of Music" field
3. Section-by-section breakdown with appropriate instrumentation tags

METATAG RULES:
1. Each section ([Intro], [Verse], [Chorus], etc.) should have a metatag describing the musical arrangement
2. Format: [Section: instrumentation details]
3. Examples:
   - [Intro: acoustic guitar, soft vocals]
   - [Verse 1: stripped back, vocals and piano only]
   - [Chorus: full band, electric guitar, powerful drums, energetic vocals]
   - [Bridge: guitar solo, no vocals, heavy drums]
   - [Outro: fade out, ambient synths]

4. Use descriptions like:
   - Instruments: "acoustic guitar", "electric bass", "808 drums", "synth pads"
   - Vocal instructions: "no vocals", "whispered vocals", "powerful vocals", "harmonies"
   - Dynamics: "stripped back", "full band", "build-up", "fade out"
   - Technical: "reverb heavy", "distorted", "clean", "lo-fi"

5. Adapt metatags based on section:
   - Verse: Usually more stripped back, focus on storytelling
   - Pre-Chorus: Build-up, adding elements
   - Chorus: Full power, all instruments
   - Bridge: Contrast, often instrumental or solo
   - Outro: Ending, fade or abrupt stop

Always respond in valid JSON format.
```

### User Prompt Template for Generation

```
Create a music project for Suno AI Custom Mode based on:

Vision: [user's vision text]
Genre: [selected genre]
Mood: [selected mood]
Tempo: [selected tempo]

Generate:

1. LYRICS: Complete song lyrics with metatag structure
   - Use [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]
   - Add [Instrumental] or other instructions where appropriate
   - Write creative, emotional lyrics matching the vision
   - Each section should have a metatag describing instrumentation
   - Example format:
     [Intro: acoustic guitar, soft piano]
     [Instrumental]
     
     [Verse 1: acoustic guitar, gentle vocals]
     Lyrics here...

2. STYLE: Comma-separated style description for "Style of Music" field
   - Genre and subgenre
   - Specific instruments
   - Vocal style (gender, voice type, delivery)
   - Technical elements (effects, production)
   - Tempo and key if relevant
   - Mood and atmosphere

3. SECTIONS: Break down the structure with metatags

Respond in JSON format:
{
  "lyrics": "Complete lyrics with metatags...",
  "style": "comma, separated, style, elements...",
  "sections": [
    {
      "section": "Intro",
      "metatag": "[Intro: acoustic guitar, soft piano]",
      "lyrics": "[Instrumental]"
    }
  ],
  "suggestions": "Tips for the user..."
}
```

---

## TypeScript Type Definitions

```typescript
// types/index.ts

export interface MetaTag {
  section: string;
  instruments: string[];
  vocalStyle?: 'normal' | 'powerful' | 'soft' | 'whispered' | 'none';
  dynamic?: 'full band' | 'stripped back' | 'build-up' | 'fade out' | 'fade in';
  customTags?: string[];
}

export interface ProjectSection {
  section: string;        // "Intro", "Verse 1", etc.
  metatag: string;       // "[Intro: acoustic guitar, soft piano]"
  lyrics: string;        // Lyrics for this section
}

export interface MusicProject {
  id: string;
  title: string;
  vision: string;
  genre: string;
  mood: string;
  tempo: string;
  lyrics: string;         // Full lyrics with metatags
  style: string;          // Comma-separated style
  sections: ProjectSection[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateProjectRequest {
  vision: string;
  genre: string;
  mood: string;
  tempo: string;
}

export interface GenerateProjectResponse {
  lyrics: string;
  style: string;
  sections: ProjectSection[];
  suggestions: string;
}

export interface RegenerateSectionRequest {
  section: string;
  currentLyrics: string;
  instructions: string;
  style: string;
}

export interface RegenerateMetatagsRequest {
  lyrics: string;
  style: string;
}
```

---

## UI/UX Specifications

### Landing Page (app/page.tsx)

**Layout:**
- Hero section with app name and tagline
- Brief explanation of what the app does
- "Create New Project" CTA button
- Optional: Example output showcase

**Design Notes:**
- Clean, modern design
- Music-themed colors (consider: blues, purples, gradients)
- Clear call-to-action

### Project Creation Page (app/create/page.tsx)

**Layout:**

```
┌─────────────────────────────────────────────┐
│  🎵 Suno AI Music Assistant                 │
│  Create Your Music Project                  │
├─────────────────────────────────────────────┤
│                                             │
│  Describe Your Music Vision                 │
│  ┌─────────────────────────────────────┐   │
│  │ [Large textarea]                    │   │
│  │ Example: A melancholic indie rock   │   │
│  │ song about lost love...             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Genre: [Dropdown ▼]  Mood: [Dropdown ▼]   │
│  Tempo: [Dropdown ▼]                        │
│                                             │
│  [✨ Generate Project] (Button)             │
│                                             │
│  ─── Generated Output (appears below) ───  │
│                                             │
│  📋 Lyrics (for Suno Custom Mode)          │
│  ┌─────────────────────────────────────┐   │
│  │ [Intro: acoustic guitar, soft piano]│   │
│  │ [Instrumental]                      │   │
│  │                                     │   │
│  │ [Verse 1: acoustic guitar, vocals] │   │
│  │ Walking down the empty street...   │   │
│  └─────────────────────────────────────┘   │
│  [📋 Copy Lyrics] [🔄 Regenerate] [✏️ Edit]│
│                                             │
│  🎸 Style of Music (for Suno Custom Mode)  │
│  ┌─────────────────────────────────────┐   │
│  │ indie rock, melancholic, electric   │   │
│  │ guitar, bass, drums, female vocals  │   │
│  └─────────────────────────────────────┘   │
│  [📋 Copy Style] [🔄 Regenerate] [✏️ Edit] │
│                                             │
│  💡 How to Use in Suno Custom Mode         │
│  1. Copy Lyrics to "Song Description"      │
│  2. Copy Style to "Style of Music"         │
│  3. Click Create in Suno!                  │
└─────────────────────────────────────────────┘
```

**Interactive Elements:**
- Form fields with validation
- Loading state during generation (show spinner + "Generating...")
- Success feedback when copying to clipboard
- Smooth transitions when output appears
- Error handling with user-friendly messages

### Color Scheme Suggestions

```css
Primary: #3B82F6 (blue-500)
Secondary: #8B5CF6 (purple-500)
Success: #10B981 (green-500)
Background: #F9FAFB (gray-50)
Text: #111827 (gray-900)
Border: #E5E7EB (gray-200)
```

---

## User Flows

### Flow 1: Create New Project

1. User lands on home page
2. Clicks "Create New Project"
3. Fills in vision text + selects genre, mood, tempo
4. Clicks "Generate Project"
5. System shows loading state (spinner + message)
6. AI generates project (2-5 seconds)
7. Output appears below form with:
   - Lyrics with metatags
   - Style description
   - Instructions for Suno
8. User copies lyrics and style to Suno
9. User creates music in Suno

### Flow 2: Regenerate Lyrics

1. User has generated project
2. Clicks "Regenerate" button under lyrics
3. System regenerates with loading state
4. New lyrics appear with updated metatags
5. Style remains consistent

### Flow 3: Regenerate Metatags Only

1. User likes lyrics but wants different arrangement
2. Clicks "Regenerate Metatags" button
3. System keeps lyrics but updates all metatags
4. New metatags appear, lyrics unchanged

---

## localStorage Schema

```typescript
// Key: 'suno-projects'
// Value: JSON string of projects array

interface StoredData {
  projects: MusicProject[];
  lastUpdated: string;
}

// Example:
{
  "projects": [
    {
      "id": "proj_1234567890",
      "title": "Melancholic Indie Rock",
      "vision": "A song about lost love...",
      "genre": "indie",
      "mood": "melancholic",
      "tempo": "medium",
      "lyrics": "[Intro: acoustic guitar, soft piano]\n...",
      "style": "indie rock, melancholic, electric guitar...",
      "sections": [...],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:35:00Z"
    }
  ],
  "lastUpdated": "2025-01-15T10:35:00Z"
}
```

---

## Development Phases

### Phase 1: Setup & Basic Generation (Priority: HIGH)
- [ ] Initialize Next.js project with TypeScript
- [ ] Install dependencies (Anthropic SDK, Tailwind)
- [ ] Set up project structure
- [ ] Create type definitions
- [ ] Implement basic landing page
- [ ] Create project creation form component
- [ ] Implement /api/generate endpoint
- [ ] Create prompt templates
- [ ] Display generated output with copy buttons
- [ ] Test end-to-end flow

### Phase 2: Interactive Features (Priority: HIGH)
- [ ] Implement localStorage utilities
- [ ] Add copy-to-clipboard functionality with feedback
- [ ] Implement regenerate lyrics feature
- [ ] Implement regenerate metatags feature
- [ ] Add loading states and error handling
- [ ] Polish UI/UX with transitions

### Phase 3: Advanced Features (Priority: MEDIUM)
- [ ] Implement regenerate style feature
- [ ] Add project list/history page
- [ ] Add save/load project functionality
- [ ] Add export project as markdown
- [ ] Improve error messages and validation

### Phase 4: Polish & Deploy (Priority: MEDIUM)
- [ ] Responsive design for mobile
- [ ] Add analytics (optional)
- [ ] Performance optimization
- [ ] Deploy to Vercel
- [ ] User testing and feedback

### Phase 5: Future Enhancements (Priority: LOW)
- [ ] Visual metatag editor with drag-and-drop
- [ ] Inline editing of lyrics
- [ ] Template library (genre presets)
- [ ] User accounts and cloud sync
- [ ] Share projects via URL
- [ ] Suno integration API (if available)

---

## Dependencies

### package.json

```json
{
  "name": "suno-ai-assistant",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.1",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---

## Testing Checklist

### Functional Testing
- [ ] Project generation works with valid inputs
- [ ] Copy to clipboard works for both lyrics and style
- [ ] Regenerate lyrics maintains style consistency
- [ ] Regenerate metatags keeps lyrics unchanged
- [ ] Error handling displays user-friendly messages
- [ ] localStorage persists projects across sessions
- [ ] Loading states appear during API calls

### Edge Cases
- [ ] Very long vision text (1000+ characters)
- [ ] Empty or minimal vision text
- [ ] Special characters in lyrics (emojis, accents)
- [ ] API timeout handling
- [ ] Invalid JSON response from Claude
- [ ] Browser without localStorage support
- [ ] Slow network connection

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## Deployment Checklist

### Pre-deployment
- [ ] Set ANTHROPIC_API_KEY in Vercel environment variables
- [ ] Test build locally: `npm run build`
- [ ] Remove console.logs
- [ ] Add proper error boundaries
- [ ] Set up error monitoring (optional: Sentry)

### Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables
- [ ] Set Node.js version (20.x)
- [ ] Deploy to production
- [ ] Test deployed version
- [ ] Set up custom domain (optional)

### Post-deployment
- [ ] Monitor API usage and costs
- [ ] Collect user feedback
- [ ] Track errors and performance
- [ ] Plan iterations based on usage

---

## Success Metrics

### MVP Success Criteria
- [ ] Users can generate complete projects in under 10 seconds
- [ ] Copy-to-clipboard works reliably
- [ ] Generated lyrics follow proper metatag format
- [ ] Projects save to localStorage successfully
- [ ] App is responsive on mobile devices
- [ ] No critical bugs in production

### Future Metrics (post-MVP)
- Number of projects generated per day
- Copy-to-clipboard usage rate
- Regeneration frequency (which features are used most)
- Average time spent on the app
- User retention rate

---

## Security Considerations

### API Key Protection
- Never expose ANTHROPIC_API_KEY in client-side code
- Use Next.js API routes as a proxy
- Store API key in environment variables only
- Consider rate limiting per user/IP (future)

### Data Privacy
- localStorage is client-side only (no server data)
- No PII collected in MVP
- Consider GDPR compliance if adding user accounts (future)

---

## Support & Documentation

### User Help
- Inline instructions for Suno Custom Mode
- Example projects (consider adding)
- FAQ section (future)

### Developer Documentation
- README.md with setup instructions
- API endpoint documentation
- Component documentation with JSDoc

---

## Known Limitations (MVP)

1. **No user accounts:** Projects are stored locally only
2. **No collaboration:** Can't share projects with others
3. **No history/version control:** Can't revert to previous versions
4. **Limited editing:** No inline editing of specific words/lines
5. **No Suno integration:** Manual copy-paste required
6. **No audio preview:** Can't preview how it will sound

These limitations are acceptable for MVP and can be addressed in future iterations.

---

## Questions for Claude Code

When working with Claude Code on this project, you can ask:

1. **Setup:** "Initialize a Next.js 14 TypeScript project with the structure defined in the PRD"
2. **Components:** "Create the ProjectForm component according to the specifications"
3. **API Routes:** "Implement the /api/generate endpoint with Claude integration"
4. **Styling:** "Add Tailwind styling to match the UI specifications"
5. **Features:** "Add copy-to-clipboard functionality with success feedback"
6. **Testing:** "Help me test the project generation flow"
7. **Debugging:** "The API is returning an error, help me fix it"
8. **Deployment:** "Prepare the project for Vercel deployment"

---

## Appendix: Example Outputs

### Example 1: Indie Rock Song

**Vision:** "A melancholic indie rock song about lost love and moving on, with acoustic guitars and emotional vocals"

**Generated Lyrics:**
```
[Intro: acoustic guitar, soft piano]
[Instrumental]

[Verse 1: acoustic guitar, gentle vocals]
Walking down the empty street
Shadows dancing at my feet
Every step a memory
Of what we used to be

[Pre-Chorus: add bass, build-up]
But I'm still here, still breathing
Finding reasons for believing

[Chorus: full band, electric guitar, powerful drums, energetic vocals]
We rise, we fall, we try again
Through the storm and pouring rain
Hearts may break but souls remain
We rise, we fall, we try again

[Verse 2: stripped back, acoustic only]
Photographs in dusty frames
Whispered words and forgotten names
Time moves on but love stays true
In everything I do

[Pre-Chorus: add bass, build-up]
And I'm still here, still standing
With open arms, expanding

[Chorus: full band, electric guitar, powerful drums, energetic vocals]
We rise, we fall, we try again
Through the storm and pouring rain
Hearts may break but souls remain
We rise, we fall, we try again

[Bridge: guitar solo, laid back drums, no vocals]
[Instrumental break]

[Final Chorus: full band, choir backing vocals, emotional climax]
We rise, we fall, we try again
Through the storm and pouring rain
Hearts may break but souls remain
We rise, we fall, we try again

[Outro: fade out, piano and acoustic guitar]
We try again...
We try again...
[Fade to end]
```

**Generated Style:**
```
indie rock, melancholic, emotional, acoustic guitar, electric guitar, 
bass, drums, piano, female vocals, alto range, powerful delivery, 
emotional depth, reverb, atmospheric production, 90 bpm, minor key, 
introspective, anthemic chorus
```

---

## End of PRD

This document should be updated as the project evolves. Version: 1.0 (MVP)
