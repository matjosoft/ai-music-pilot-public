# Claude Code Build Instructions - Suno AI Music Assistant

This document provides step-by-step instructions for using Claude Code to build the Suno AI Music Assistant project.

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20.x or higher installed
- An Anthropic API key
- Claude Code CLI tool installed
- Git installed (for version control)

---

## Phase 1: Project Setup

### Step 1: Initialize Project

**Prompt for Claude Code:**
```
Initialize a new Next.js 14 project with TypeScript using the App Router. 
Configure it with:
- TypeScript (strict mode)
- Tailwind CSS
- App Router
- src/ directory: NO (use app/ directory)
- import alias: @/*

Project name: suno-ai-assistant
```

### Step 2: Install Dependencies

**Prompt for Claude Code:**
```
Install the following dependencies for the Suno AI Music Assistant project:

Production dependencies:
- @anthropic-ai/sdk (latest)
- lucide-react (for icons)

The project should already have Next.js, React, and Tailwind installed.
Update package.json if needed.
```

### Step 3: Create Project Structure

**Prompt for Claude Code:**
```
Create the following directory structure for the project:

app/
├── layout.tsx
├── page.tsx
├── create/
│   └── page.tsx
├── project/
│   └── [id]/
│       └── page.tsx
└── api/
    ├── generate/
    │   └── route.ts
    ├── regenerate/
    │   └── route.ts
    └── regenerate-metatags/
        └── route.ts

components/
├── ProjectForm.tsx
├── CustomModeOutput.tsx
├── LyricsEditor.tsx
├── StyleEditor.tsx
└── SunoInstructions.tsx

lib/
├── anthropic.ts
├── prompts.ts
├── storage.ts
└── utils.ts

types/
└── index.ts

Create placeholder files for now, we'll implement them next.
```

### Step 4: Set Up Environment Variables

**Prompt for Claude Code:**
```
Create a .env.local file with the following structure:
ANTHROPIC_API_KEY=your_api_key_here

Also create a .env.example file with:
ANTHROPIC_API_KEY=

Add .env.local to .gitignore if not already there.
```

---

## Phase 2: Type Definitions

### Step 5: Define TypeScript Types

**Prompt for Claude Code:**
```
Create comprehensive TypeScript type definitions in types/index.ts for the Suno AI Music Assistant.

Include types for:
1. MetaTag - describes instrumentation for a song section
2. ProjectSection - a section of the song with metatag and lyrics
3. MusicProject - complete project data structure
4. GenerateProjectRequest - API request for project generation
5. GenerateProjectResponse - API response for project generation
6. RegenerateSectionRequest - API request for section regeneration
7. RegenerateMetatagsRequest - API request for metatag regeneration

Reference the PRD document for exact specifications.
```

---

## Phase 3: Prompts and AI Integration

### Step 6: Create Prompt Templates

**Prompt for Claude Code:**
```
Create lib/prompts.ts with the following prompt templates for the Suno AI Music Assistant:

1. SYSTEM_PROMPT - The system prompt that defines Claude's role and metatag rules
2. GENERATE_PROJECT_PROMPT - Function that takes GenerateProjectRequest and returns a user prompt
3. REGENERATE_SECTION_PROMPT - Function for regenerating a specific section
4. REGENERATE_METATAGS_PROMPT - Function for regenerating all metatags

The prompts should:
- Instruct Claude to generate lyrics with intelligent metatags
- Define metatag format: [Section: instrumentation details]
- Provide examples of good metatags
- Specify section-specific patterns (Intro, Verse, Chorus, Bridge, Outro)
- Request JSON responses with lyrics, style, and sections array

Reference the PRD's "AI Prompting Strategy" section for exact specifications.
```

### Step 7: Create Anthropic Client

**Prompt for Claude Code:**
```
Create lib/anthropic.ts with a utility for calling the Anthropic API.

Include:
- A function to initialize the Anthropic client
- Error handling for missing API keys
- Type-safe wrapper functions for making requests

Use model: claude-sonnet-4-20250514
```

---

## Phase 4: API Routes

### Step 8: Implement Generate API

**Prompt for Claude Code:**
```
Implement app/api/generate/route.ts that:

1. Accepts POST requests with GenerateProjectRequest body
2. Validates the request
3. Calls Claude API with the system prompt and user prompt
4. Parses the JSON response
5. Returns GenerateProjectResponse
6. Handles errors gracefully with appropriate HTTP status codes

Use max_tokens: 4000 for generation
Include proper error logging
```

### Step 9: Implement Regenerate API

**Prompt for Claude Code:**
```
Implement app/api/regenerate/route.ts that:

1. Accepts POST requests with RegenerateSectionRequest body
2. Calls Claude API to regenerate a specific section
3. Returns the new section with updated metatag and lyrics
4. Maintains consistency with the overall project style

Use max_tokens: 2000
```

### Step 10: Implement Regenerate Metatags API

**Prompt for Claude Code:**
```
Implement app/api/regenerate-metatags/route.ts that:

1. Accepts POST requests with RegenerateMetatagsRequest body
2. Calls Claude API to analyze lyrics and suggest new metatags
3. Returns updated metatags for all sections
4. Keeps the lyrics unchanged

Use max_tokens: 2000
```

---

## Phase 5: Core Components

### Step 11: Create ProjectForm Component

**Prompt for Claude Code:**
```
Create components/ProjectForm.tsx - the initial project creation form.

Features:
- Large textarea for music vision (required)
- Genre dropdown with options: pop, rock, indie, electronic, hip-hop, r&b, country, jazz, folk
- Mood dropdown with options: uplifting, melancholic, energetic, calm, dark, romantic, aggressive
- Tempo dropdown with options: slow, medium, fast, very-fast
- Generate button with loading state
- Form validation
- Responsive design with Tailwind CSS

Props:
- onGenerate: callback function with form data
- isLoading: boolean for loading state

Use lucide-react icons (Loader2 for loading spinner)
```

### Step 12: Create CustomModeOutput Component

**Prompt for Claude Code:**
```
Create components/CustomModeOutput.tsx - displays the two-field output for Suno Custom Mode.

Features:
- Two separate sections: Lyrics and Style
- Copy to clipboard buttons for each with success feedback
- Regenerate buttons
- Display lyrics in a monospace font (pre-formatted)
- Display style as regular text
- Instructions section explaining how to use in Suno
- Smooth transitions and feedback animations

Props:
- lyrics: string
- style: string
- onRegenerateLyrics: callback
- onRegenerateStyle: callback
- onRegenerateMetatags: callback

Use lucide-react icons (Copy, RefreshCw, Check)
Style with Tailwind CSS following the color scheme in the PRD
```

### Step 13: Create SunoInstructions Component

**Prompt for Claude Code:**
```
Create components/SunoInstructions.tsx - a helpful component explaining how to use the output in Suno.

Display:
1. Step-by-step instructions
2. Tips for best results
3. Link to Suno (if appropriate)

Style with Tailwind CSS in an info/help style (blue background, clear typography)
```

---

## Phase 6: Utility Functions

### Step 14: Create Storage Utilities

**Prompt for Claude Code:**
```
Create lib/storage.ts with localStorage utilities for the Suno AI Music Assistant.

Functions needed:
1. saveProject(project: MusicProject): void - Save a project to localStorage
2. loadProject(id: string): MusicProject | null - Load a specific project
3. loadAllProjects(): MusicProject[] - Load all saved projects
4. deleteProject(id: string): void - Delete a project
5. generateProjectId(): string - Generate unique project IDs

Storage key: 'suno-projects'
Include error handling for localStorage issues (quota exceeded, unavailable, etc.)
```

### Step 15: Create Utility Functions

**Prompt for Claude Code:**
```
Create lib/utils.ts with helper functions:

1. cn(...inputs) - For merging Tailwind classes (clsx pattern)
2. copyToClipboard(text: string): Promise<boolean> - Copy text with fallback
3. formatDate(date: string): string - Format ISO dates for display
4. generateTitle(vision: string, genre: string): string - Generate project title from vision

Include proper error handling and TypeScript types.
```

---

## Phase 7: Pages

### Step 16: Create Landing Page

**Prompt for Claude Code:**
```
Create app/page.tsx - the landing/home page for the Suno AI Music Assistant.

Include:
- Hero section with app name and tagline
- Brief description of what the app does (3-4 sentences)
- Prominent "Create New Project" button (links to /create)
- Clean, modern design with music-themed colors
- Responsive layout

Use Tailwind CSS
Style according to the color scheme in the PRD (blues and purples)
```

### Step 17: Create Project Creation Page

**Prompt for Claude Code:**
```
Create app/create/page.tsx - the main project creation and editing page.

This is the core page of the app. It should:

1. Render the ProjectForm component at the top
2. Handle form submission by calling /api/generate
3. Show loading state during generation
4. Display CustomModeOutput component with results
5. Manage state for the entire workflow
6. Handle errors with user-friendly messages
7. Save projects to localStorage after generation

State management:
- Form data
- Loading state
- Generated project data
- Error state

Include proper TypeScript types and error boundaries
```

### Step 18: Create Root Layout

**Prompt for Claude Code:**
```
Update app/layout.tsx with:

1. Basic HTML structure
2. Tailwind CSS imports
3. Font configuration (use system fonts or Inter)
4. Metadata (title, description)
5. Simple header with app name
6. Optional: footer with credits

Keep it minimal and clean for MVP
```

---

## Phase 8: Styling and Polish

### Step 19: Configure Tailwind

**Prompt for Claude Code:**
```
Update tailwind.config.ts with:

1. Custom colors matching the PRD color scheme:
   - Primary: blue-500
   - Secondary: purple-500
   - Success: green-500
   
2. Custom spacing if needed
3. Animation configurations for smooth transitions

Ensure all components can access these custom styles
```

### Step 20: Add Loading States

**Prompt for Claude Code:**
```
Review all components and ensure proper loading states:

1. ProjectForm - disable button and show spinner during generation
2. CustomModeOutput - show loading when regenerating
3. API routes - return proper loading responses

Add subtle animations for state transitions using Tailwind
```

### Step 21: Add Error Handling

**Prompt for Claude Code:**
```
Add comprehensive error handling throughout the app:

1. API route error responses
2. Client-side error boundaries
3. User-friendly error messages
4. Network error handling
5. Invalid JSON response handling

Create a simple error display component if needed
```

---

## Phase 9: Testing and Refinement

### Step 22: Test Complete Flow

**Prompt for Claude Code:**
```
Help me test the complete user flow:

1. Start dev server
2. Navigate to home page
3. Click "Create New Project"
4. Fill in form with test data
5. Submit and verify generation
6. Test copy-to-clipboard functionality
7. Test regenerate features
8. Verify localStorage persistence

Report any issues found during testing
```

### Step 23: Fix Issues

**Prompt for Claude Code:**
```
[List any issues found during testing]

Help me fix these issues one by one. For each issue:
1. Diagnose the root cause
2. Propose a solution
3. Implement the fix
4. Verify it works
```

### Step 24: Optimize Performance

**Prompt for Claude Code:**
```
Review the app for performance optimization opportunities:

1. Check bundle size
2. Optimize images (if any)
3. Add React.memo where appropriate
4. Review API call efficiency
5. Optimize re-renders

Implement improvements where beneficial
```

---

## Phase 10: Deployment Preparation

### Step 25: Prepare for Vercel

**Prompt for Claude Code:**
```
Prepare the project for Vercel deployment:

1. Ensure build succeeds: npm run build
2. Create vercel.json if needed
3. Document environment variables needed
4. Update README.md with:
   - Setup instructions
   - Environment variable configuration
   - Deployment steps
5. Remove console.logs and debug code
6. Add .vercelignore if needed
```

### Step 26: Create Documentation

**Prompt for Claude Code:**
```
Create a comprehensive README.md with:

1. Project description
2. Features list
3. Setup instructions
4. Environment variables
5. Development commands
6. Deployment guide
7. Tech stack
8. License (MIT)

Make it clear and easy to follow for other developers
```

---

## Phase 11: Optional Enhancements (Post-MVP)

### Step 27: Add Project History (Optional)

**Prompt for Claude Code:**
```
Create a project history/list page at app/projects/page.tsx:

1. Display all saved projects from localStorage
2. Show project title, date, genre
3. Allow clicking to open a project
4. Add delete functionality
5. Add search/filter

This is optional for MVP but nice to have
```

### Step 28: Add Export Functionality (Optional)

**Prompt for Claude Code:**
```
Add export functionality to download projects as markdown files:

1. Add export button to CustomModeOutput
2. Generate markdown with lyrics and style
3. Trigger download
4. Include project metadata

This is optional for MVP
```

---

## Debugging Commands

If you encounter issues, use these prompts:

### API Not Working
```
The API route at /api/generate is returning an error. 
Error message: [paste error]
Help me debug this issue.
```

### Component Not Rendering
```
The [ComponentName] component is not rendering correctly.
Expected behavior: [describe]
Actual behavior: [describe]
Help me fix this.
```

### Styling Issues
```
The styling for [component/page] doesn't match the design.
Expected: [describe]
Actual: [describe]
Help me adjust the Tailwind classes.
```

### TypeScript Errors
```
I'm getting TypeScript errors in [file]:
[paste errors]
Help me resolve these type issues.
```

---

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

---

## Success Checklist

Before considering Phase 1 complete:
- [ ] Project initializes without errors
- [ ] Dev server runs successfully
- [ ] All TypeScript types are defined
- [ ] API routes respond correctly
- [ ] Form submission triggers generation
- [ ] Output displays in correct format
- [ ] Copy to clipboard works
- [ ] localStorage saves projects
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] Build succeeds without errors

---

## Notes for Working with Claude Code

1. **Be Specific**: When asking Claude Code to implement features, reference specific sections of the PRD
2. **Iterate**: Build and test each phase before moving to the next
3. **Review Code**: Always review generated code before accepting
4. **Test Frequently**: Test after each major component is added
5. **Save Progress**: Commit to git after completing each phase
6. **Ask Questions**: If something is unclear, ask Claude Code to explain before implementing

---

## Example Session Flow

Here's how a typical session might look:

```
You: "Let's start Phase 1. Initialize the Next.js project with TypeScript and Tailwind."

Claude Code: [Creates project structure]

You: "Great! Now let's do Step 3 - create the directory structure."

Claude Code: [Creates directories and placeholder files]

You: "Perfect. Now implement Step 6 - create the prompt templates in lib/prompts.ts"

Claude Code: [Implements prompts]

You: "Can you show me an example of what the generated output would look like?"

Claude Code: [Provides example]

You: "Looks good! Let's move to Step 8 - implement the generate API route."

[Continue iterating through phases]
```

---

## Troubleshooting Common Issues

### Issue: API Key Not Found
**Solution:** 
```
Check that .env.local exists and has ANTHROPIC_API_KEY set.
Restart the dev server after adding environment variables.
```

### Issue: Module Not Found
**Solution:**
```
Run: npm install
Check that all dependencies are in package.json
Verify import paths use @/ alias correctly
```

### Issue: Build Fails
**Solution:**
```
Check for TypeScript errors: npx tsc --noEmit
Fix any type issues
Ensure all imports are correct
```

### Issue: Vercel Deployment Fails
**Solution:**
```
Check build logs in Vercel dashboard
Verify environment variables are set in Vercel
Ensure build succeeds locally first
```

---

## End of Build Instructions

Use this document as a guide for working with Claude Code. Follow the phases in order, test frequently, and iterate based on feedback.

Good luck building your Suno AI Music Assistant! 🎵
