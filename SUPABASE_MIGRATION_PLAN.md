# Supabase SaaS Migration Plan
## Suno AI Music Assistant - Complete Implementation Guide

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Setup & Authentication](#phase-1-setup--authentication)
4. [Phase 2: Database Migration](#phase-2-database-migration)
5. [Phase 3: User Features](#phase-3-user-features)
6. [Phase 4: Monetization](#phase-4-monetization)
7. [Rollback Strategy](#rollback-strategy)
8. [Testing Checklist](#testing-checklist)
9. [Cost Analysis](#cost-analysis)

---

## Executive Summary

**Goal:** Transform the Suno Assistant from a client-side app into a multi-tenant SaaS application using Supabase.

**Current State:**
- Client-side Next.js app
- localStorage for data persistence
- No authentication
- AI generation via Anthropic/OpenAI APIs

**Target State:**
- Multi-user SaaS platform
- Cloud-based project storage
- User authentication & profiles
- Usage tracking & subscription tiers
- Project sharing capabilities

**Total Estimated Effort:** 15-20 hours
**Recommended Timeline:** 2-3 weeks (testing between phases)

---

## Prerequisites

### 1. Supabase Account Setup
- [ ] Create account at https://supabase.com
- [ ] Create new project (choose region close to users)
- [ ] Note down project URL and API keys
- [ ] Enable Email Auth in Authentication settings
- [ ] (Optional) Configure OAuth providers (Google, GitHub)

### 2. Development Environment
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Node.js 18+ installed
- [ ] PostgreSQL knowledge (basic)
- [ ] Git for version control

### 3. Dependencies to Install
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install -D @supabase/auth-ui-react @supabase/auth-ui-shared
```

### 4. Environment Variables (Add to .env.local)
```env
# Existing
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key

# New Supabase Variables
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

---

## Phase 1: Setup & Authentication

**Goal:** Add user registration, login, and session management

**Estimated Time:** 3-4 hours

### 1.1 Supabase Client Setup

#### Create `lib/supabase/client.ts` (Client-side)
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export const createClient = () => {
  return createClientComponentClient<Database>()
}
```

#### Create `lib/supabase/server.ts` (Server-side)
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
```

#### Create `lib/supabase/middleware.ts` (Route protection)
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect /create route
  if (req.nextUrl.pathname.startsWith('/create') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/create/:path*', '/dashboard/:path*', '/profile/:path*']
}
```

### 1.2 Authentication Pages

#### Create `app/login/page.tsx`
```typescript
'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/create')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to Suno Assistant</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          redirectTo={`${window.location.origin}/auth/callback`}
        />
      </div>
    </div>
  )
}
```

#### Create `app/auth/callback/route.ts`
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin + '/create')
}
```

#### Create `app/logout/route.ts`
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url))
}
```

### 1.3 Update Root Layout

#### Modify `app/layout.tsx`
```typescript
// Add user session provider and auth check
import { createServerClient } from '@/lib/supabase/server'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body>
        {/* Add navigation with login/logout */}
        <nav className="bg-indigo-900 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/">Suno Assistant</Link>
            <div>
              {session ? (
                <>
                  <span className="mr-4">{session.user.email}</span>
                  <form action="/logout" method="POST" className="inline">
                    <button type="submit">Logout</button>
                  </form>
                </>
              ) : (
                <Link href="/login">Login</Link>
              )}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
```

### 1.4 Update Landing Page

#### Modify `app/page.tsx`
```typescript
// Change CTA button to redirect to /login if not authenticated
// Or /create if authenticated
import { createServerClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const ctaLink = session ? '/create' : '/login'

  return (
    // ... existing landing page
    // Update CTA button href to {ctaLink}
  )
}
```

### 1.5 Testing Checklist (Phase 1)
- [ ] User can register with email/password
- [ ] User receives confirmation email
- [ ] User can log in
- [ ] User can log out
- [ ] Protected routes redirect to login
- [ ] After login, user is redirected to /create
- [ ] Session persists on page refresh
- [ ] OAuth providers work (if configured)

---

## Phase 2: Database Migration

**Goal:** Move project storage from localStorage to Supabase PostgreSQL

**Estimated Time:** 4-5 hours

### 2.1 Database Schema

#### Create Migration File: `supabase/migrations/001_initial_schema.sql`
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('custom', 'artist')),
  songs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own projects
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Run Migration
```bash
supabase db push
```

### 2.2 Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

#### Update `types/index.ts`
```typescript
// Add Supabase database types
export type { Database } from './supabase'

// Existing Project type should match database structure
export interface Project {
  id: string
  user_id: string
  name: string
  mode: 'custom' | 'artist'
  songs: Song[]
  created_at: string
  updated_at: string
}

export interface Song {
  lyrics: string
  style: string
  title: string
}
```

### 2.3 Create Database Service Layer

#### Create `lib/services/projects.ts`
```typescript
import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
import type { Project, Song } from '@/types'

export class ProjectService {
  // Client-side methods
  static async getAllProjects(): Promise<Project[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Project[]
  }

  static async getProject(id: string): Promise<Project | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Project
  }

  static async createProject(
    name: string,
    mode: 'custom' | 'artist',
    songs: Song[]
  ): Promise<Project> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        mode,
        songs
      })
      .select()
      .single()

    if (error) throw error
    return data as Project
  }

  static async updateProject(
    id: string,
    updates: Partial<Pick<Project, 'name' | 'songs'>>
  ): Promise<Project> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Project
  }

  static async deleteProject(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Server-side methods (for API routes)
  static async createProjectServer(
    userId: string,
    name: string,
    mode: 'custom' | 'artist',
    songs: Song[]
  ): Promise<Project> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        mode,
        songs
      })
      .select()
      .single()

    if (error) throw error
    return data as Project
  }

  static async updateProjectServer(
    userId: string,
    id: string,
    updates: Partial<Pick<Project, 'name' | 'songs'>>
  ): Promise<Project> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // Ensure ownership
      .select()
      .single()

    if (error) throw error
    return data as Project
  }
}
```

### 2.4 Update API Routes

#### Modify `app/api/generate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectService } from '@/lib/services/projects'
import { getAIClient } from '@/lib/ai-client'
// ... existing imports

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { projectName, mode, ...generationParams } = body

    // 3. Generate content using AI (existing logic)
    const aiClient = getAIClient()
    const generatedContent = await aiClient.generateProject(generationParams)

    // 4. Save to Supabase instead of returning for localStorage
    const project = await ProjectService.createProjectServer(
      user.id,
      projectName,
      mode,
      generatedContent.songs
    )

    // 5. Return project with ID
    return NextResponse.json({
      success: true,
      project
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate project' },
      { status: 500 }
    )
  }
}
```

#### Modify `app/api/regenerate/route.ts`
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, songIndex, ...params } = await request.json()

    // 1. Fetch existing project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Regenerate lyrics using AI
    const aiClient = getAIClient()
    const newLyrics = await aiClient.regenerateLyrics(params)

    // 3. Update project in database
    const updatedSongs = [...project.songs]
    updatedSongs[songIndex] = {
      ...updatedSongs[songIndex],
      lyrics: newLyrics
    }

    const updatedProject = await ProjectService.updateProjectServer(
      user.id,
      projectId,
      { songs: updatedSongs }
    )

    return NextResponse.json({
      success: true,
      project: updatedProject
    })

  } catch (error) {
    console.error('Regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate lyrics' },
      { status: 500 }
    )
  }
}
```

#### Similar updates for `app/api/regenerate-metatags/route.ts`

### 2.5 Update Frontend Components

#### Modify `components/ProjectForm.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// Remove localStorage import

export default function ProjectForm() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          mode,
          // ... other form data
        })
      })

      if (!response.ok) throw new Error('Generation failed')

      const { project } = await response.json()

      // Redirect to project view page instead of storing in localStorage
      router.push(`/project/${project.id}`)

    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate project. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    // ... existing form JSX
  )
}
```

#### Create `app/project/[id]/page.tsx` (New page to view project)
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CustomModeOutput from '@/components/CustomModeOutput'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !project) {
    notFound()
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">{project.name}</h1>
      <CustomModeOutput
        songs={project.songs}
        projectId={project.id}
      />
    </div>
  )
}
```

#### Update `components/CustomModeOutput.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Song } from '@/types'

interface Props {
  songs: Song[]
  projectId: string // Add projectId prop
}

export default function CustomModeOutput({ songs, projectId }: Props) {
  const [currentSongs, setCurrentSongs] = useState(songs)

  const handleRegenerate = async (songIndex: number) => {
    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          songIndex,
          // ... other params
        })
      })

      const { project } = await response.json()
      setCurrentSongs(project.songs)

    } catch (error) {
      console.error('Regeneration failed:', error)
    }
  }

  return (
    // ... existing JSX with updated regenerate handlers
  )
}
```

### 2.6 Migration Utility (localStorage → Supabase)

#### Create `lib/utils/migrate-projects.ts`
```typescript
import { createClient } from '@/lib/supabase/client'
import { loadProjects } from '@/lib/storage' // existing localStorage function

export async function migrateLocalStorageProjects() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get projects from localStorage
  const localProjects = loadProjects()

  if (localProjects.length === 0) {
    return { migrated: 0, message: 'No projects to migrate' }
  }

  let migrated = 0
  const errors = []

  for (const project of localProjects) {
    try {
      await supabase.from('projects').insert({
        user_id: user.id,
        name: project.projectName,
        mode: project.mode,
        songs: project.songs,
        created_at: project.timestamp
      })
      migrated++
    } catch (error) {
      errors.push({ project: project.projectName, error })
    }
  }

  // Clear localStorage after successful migration
  if (migrated > 0 && errors.length === 0) {
    localStorage.removeItem('suno-projects')
  }

  return { migrated, errors }
}
```

#### Create migration button in user dashboard
```typescript
// In app/dashboard/page.tsx or similar
<button onClick={handleMigrate}>
  Import Projects from Browser Storage
</button>
```

### 2.7 Testing Checklist (Phase 2)
- [ ] New projects save to Supabase
- [ ] Projects appear after page refresh
- [ ] Only user's own projects are visible
- [ ] Cannot access other users' projects by ID
- [ ] Regenerate updates database correctly
- [ ] Migration tool successfully imports localStorage projects
- [ ] RLS policies prevent unauthorized access
- [ ] Database queries are performant

---

## Phase 3: User Features

**Goal:** Add project management, sharing, and enhanced user experience

**Estimated Time:** 4-5 hours

### 3.1 Projects Dashboard

#### Create `app/dashboard/page.tsx`
```typescript
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import DeleteProjectButton from '@/components/DeleteProjectButton'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Projects</h1>
        <Link
          href="/create"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Create New Project
        </Link>
      </div>

      {projects?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No projects yet</p>
          <Link
            href="/create"
            className="text-indigo-600 hover:underline"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  {project.mode}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {project.songs.length} song{project.songs.length !== 1 ? 's' : ''}
              </p>

              <p className="text-xs text-gray-500 mb-4">
                Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/project/${project.id}`}
                  className="flex-1 text-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  View
                </Link>
                <DeleteProjectButton projectId={project.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 3.2 Project Sharing

#### Add public sharing column to database
```sql
-- Migration: supabase/migrations/002_add_sharing.sql
ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN public_slug VARCHAR(255) UNIQUE;

CREATE INDEX idx_projects_public_slug ON projects(public_slug) WHERE is_public = true;

-- Public projects can be viewed by anyone
CREATE POLICY "Public projects are viewable by all"
  ON projects FOR SELECT
  USING (is_public = true);
```

#### Create `app/api/projects/[id]/share/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Generate public slug if not exists
  const publicSlug = project.public_slug || nanoid(10)

  const { data: updated, error } = await supabase
    .from('projects')
    .update({
      is_public: true,
      public_slug: publicSlug
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${publicSlug}`
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_public: false })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

#### Create `app/shared/[slug]/page.tsx`
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CustomModeOutput from '@/components/CustomModeOutput'

export default async function SharedProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createServerClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('public_slug', params.slug)
    .eq('is_public', true)
    .single()

  if (!project) {
    notFound()
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-gray-600">Shared by a Suno Assistant user</p>
      </div>

      <CustomModeOutput
        songs={project.songs}
        projectId={project.id}
        readOnly={true} // Disable regenerate for public view
      />

      <div className="mt-8 p-6 bg-indigo-50 rounded-lg text-center">
        <p className="mb-4">Create your own music prompts with Suno Assistant</p>
        <Link
          href="/login"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  )
}
```

### 3.3 User Profile & Preferences

#### Add preferences table
```sql
-- Migration: supabase/migrations/003_user_preferences.sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_ai_provider VARCHAR(50) DEFAULT 'anthropic',
  default_word_density VARCHAR(50) DEFAULT 'medium',
  default_genre VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### Create `app/profile/page.tsx`
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PreferencesForm from '@/components/PreferencesForm'

export default async function ProfilePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="text-gray-600">Email: {user.email}</p>
        <p className="text-gray-600">
          Member since: {new Date(user.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <PreferencesForm initialPreferences={preferences} />
      </div>
    </div>
  )
}
```

### 3.4 Project Version History (Optional)

#### Add version history table
```sql
-- Migration: supabase/migrations/004_project_history.sql
CREATE TABLE project_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  songs JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);

ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project versions"
  ON project_versions FOR SELECT
  USING (auth.uid() = user_id);
```

#### Create version snapshot on each regeneration
```typescript
// In app/api/regenerate/route.ts
// Before updating project, create version snapshot
await supabase.from('project_versions').insert({
  project_id: projectId,
  user_id: user.id,
  songs: project.songs
})
```

### 3.5 Testing Checklist (Phase 3)
- [ ] Dashboard displays all user projects
- [ ] Projects can be deleted
- [ ] Share link generates correctly
- [ ] Shared projects accessible via public URL
- [ ] Non-public projects return 404 on public URL
- [ ] User preferences save correctly
- [ ] Preferences apply to new projects
- [ ] Version history captures changes
- [ ] Version history accessible from project view

---

## Phase 4: Monetization

**Goal:** Add subscription tiers, usage tracking, and payment integration

**Estimated Time:** 5-6 hours

### 4.1 Subscription Schema

#### Database migration
```sql
-- Migration: supabase/migrations/005_subscriptions.sql
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usage tracking table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'generate', 'regenerate', 'regenerate_metatags'
  credits_used INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Monthly usage view
CREATE VIEW user_monthly_usage AS
SELECT
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_generations,
  SUM(credits_used) as total_credits
FROM usage_logs
GROUP BY user_id, DATE_TRUNC('month', created_at);
```

### 4.2 Tier Configuration

#### Create `lib/config/tiers.ts`
```typescript
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    monthlyGenerations: 10,
    features: [
      '10 generations per month',
      'Custom & Artist modes',
      'Basic support',
      'Projects saved for 30 days'
    ]
  },
  pro: {
    name: 'Pro',
    price: 19,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    monthlyGenerations: 500,
    features: [
      '500 generations per month',
      'All Free features',
      'Unlimited project storage',
      'Priority support',
      'Advanced customization',
      'Export to PDF/JSON'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    monthlyGenerations: -1, // unlimited
    features: [
      'Unlimited generations',
      'All Pro features',
      'API access',
      'Custom AI model fine-tuning',
      'Dedicated account manager',
      'SLA guarantee'
    ]
  }
} as const

export type TierName = keyof typeof SUBSCRIPTION_TIERS
```

### 4.3 Usage Tracking Middleware

#### Create `lib/middleware/usage-tracking.ts`
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_TIERS } from '@/lib/config/tiers'

export async function checkAndTrackUsage(
  userId: string,
  action: 'generate' | 'regenerate' | 'regenerate_metatags'
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createServerClient()

  // Get user's subscription tier
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single()

  const tier = subscription?.tier || 'free'
  const tierConfig = SUBSCRIPTION_TIERS[tier]

  // If unlimited, allow immediately
  if (tierConfig.monthlyGenerations === -1) {
    await logUsage(userId, action)
    return { allowed: true }
  }

  // Check current month's usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usageData, error } = await supabase
    .from('usage_logs')
    .select('credits_used')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) throw error

  const currentUsage = usageData?.reduce((sum, log) => sum + log.credits_used, 0) || 0

  if (currentUsage >= tierConfig.monthlyGenerations) {
    return {
      allowed: false,
      reason: `Monthly limit of ${tierConfig.monthlyGenerations} generations reached. Upgrade to Pro for more.`
    }
  }

  // Log usage
  await logUsage(userId, action)

  return { allowed: true }
}

async function logUsage(userId: string, action: string) {
  const supabase = createServerClient()

  await supabase.from('usage_logs').insert({
    user_id: userId,
    action,
    credits_used: 1
  })
}
```

#### Update `app/api/generate/route.ts`
```typescript
import { checkAndTrackUsage } from '@/lib/middleware/usage-tracking'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check usage limits BEFORE generating
  const usageCheck = await checkAndTrackUsage(user.id, 'generate')

  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: usageCheck.reason, code: 'USAGE_LIMIT_EXCEEDED' },
      { status: 429 } // Too Many Requests
    )
  }

  // Continue with generation...
}
```

### 4.4 Stripe Integration

#### Install Stripe SDK
```bash
npm install stripe @stripe/stripe-js
```

#### Create `lib/stripe.ts`
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export const getStripeCustomerId = async (userId: string, email: string) => {
  const supabase = createServerClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId }
  })

  // Save to database
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customer.id
    })

  return customer.id
}
```

#### Create `app/api/stripe/create-checkout-session/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe, getStripeCustomerId } from '@/lib/stripe'
import { SUBSCRIPTION_TIERS } from '@/lib/config/tiers'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tier } = await request.json()

  if (!['pro', 'enterprise'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const customerId = await getStripeCustomerId(user.id, user.email!)
  const tierConfig = SUBSCRIPTION_TIERS[tier as 'pro' | 'enterprise']

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: tierConfig.stripePriceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?upgrade=cancelled`,
    metadata: {
      user_id: user.id,
      tier
    }
  })

  return NextResponse.json({ url: session.url })
}
```

#### Create `app/api/stripe/webhook/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role key for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      await supabase
        .from('subscriptions')
        .update({
          tier: session.metadata!.tier,
          stripe_subscription_id: session.subscription as string,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', session.metadata!.user_id)

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        })
        .eq('stripe_subscription_id', subscription.id)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({ tier: 'free' })
        .eq('stripe_subscription_id', subscription.id)

      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### 4.5 Pricing Page

#### Create `app/pricing/page.tsx`
```typescript
import { SUBSCRIPTION_TIERS } from '@/lib/config/tiers'
import PricingCard from '@/components/PricingCard'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold text-white text-center mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-purple-200 text-center mb-12">
          Choose the plan that works for you
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
            <PricingCard
              key={key}
              tierKey={key as any}
              name={tier.name}
              price={tier.price}
              features={tier.features}
              highlighted={key === 'pro'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### Create `components/PricingCard.tsx`
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { TierName } from '@/lib/config/tiers'

interface Props {
  tierKey: TierName
  name: string
  price: number
  features: string[]
  highlighted?: boolean
}

export default function PricingCard({ tierKey, name, price, features, highlighted }: Props) {
  const router = useRouter()

  const handleSubscribe = async () => {
    if (tierKey === 'free') {
      router.push('/login')
      return
    }

    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: tierKey })
    })

    const { url } = await response.json()
    window.location.href = url
  }

  return (
    <div className={`bg-white rounded-lg p-8 ${highlighted ? 'ring-4 ring-indigo-600 scale-105' : ''}`}>
      {highlighted && (
        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </span>
      )}

      <h3 className="text-2xl font-bold mt-4">{name}</h3>
      <div className="mt-4 mb-6">
        <span className="text-5xl font-bold">${price}</span>
        <span className="text-gray-600">/month</span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        className={`w-full py-3 rounded-lg font-semibold ${
          highlighted
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {tierKey === 'free' ? 'Get Started' : 'Subscribe'}
      </button>
    </div>
  )
}
```

### 4.6 Usage Dashboard

#### Add to `app/dashboard/page.tsx`
```typescript
// Fetch usage data
const { data: currentUsage } = await supabase
  .from('user_monthly_usage')
  .select('*')
  .eq('user_id', user.id)
  .eq('month', new Date().toISOString().slice(0, 7))
  .single()

const { data: subscription } = await supabase
  .from('subscriptions')
  .select('tier')
  .eq('user_id', user.id)
  .single()

const tier = subscription?.tier || 'free'
const tierConfig = SUBSCRIPTION_TIERS[tier]
const usageCount = currentUsage?.total_generations || 0
const usagePercent = tierConfig.monthlyGenerations === -1
  ? 0
  : (usageCount / tierConfig.monthlyGenerations) * 100

// Add usage widget to dashboard
<div className="bg-white rounded-lg shadow p-6 mb-8">
  <h2 className="text-xl font-semibold mb-4">Monthly Usage</h2>
  <div className="flex justify-between items-center mb-2">
    <span>{usageCount} / {tierConfig.monthlyGenerations === -1 ? '∞' : tierConfig.monthlyGenerations} generations</span>
    <span className="text-sm text-gray-600">{tier.toUpperCase()} Plan</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-indigo-600 h-2 rounded-full"
      style={{ width: `${Math.min(usagePercent, 100)}%` }}
    />
  </div>
  {usagePercent > 80 && (
    <p className="mt-2 text-sm text-orange-600">
      You're approaching your monthly limit. Consider upgrading.
    </p>
  )}
</div>
```

### 4.7 Environment Variables

#### Update `.env.example`
```env
# Existing
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.8 Testing Checklist (Phase 4)
- [ ] Free tier limits work correctly
- [ ] Upgrade flow completes successfully
- [ ] Stripe webhook updates subscription
- [ ] Usage resets monthly
- [ ] Overage prevents generation
- [ ] Downgrade to free works
- [ ] Cancellation handled properly
- [ ] Usage dashboard displays accurately
- [ ] Stripe test mode works end-to-end

---

## Rollback Strategy

### If Things Go Wrong

#### Phase 1 Rollback (Auth Issues)
```bash
# Revert to pre-auth state
git checkout main
npm install
# Remove Supabase dependencies
npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs
```

#### Phase 2 Rollback (Database Issues)
```bash
# Revert database migrations
supabase db reset

# Keep auth, revert to localStorage
# Comment out database calls in API routes
# Uncomment localStorage code
```

#### Phase 3 Rollback
- Simply don't deploy dashboard/sharing features
- Existing functionality remains intact

#### Phase 4 Rollback
- Remove Stripe integration
- Disable usage tracking
- All users remain on free tier

### Data Backup
```bash
# Before each phase, backup Supabase database
supabase db dump -f backup-$(date +%Y%m%d).sql

# Backup localStorage before migration
# Create export button that downloads JSON
```

---

## Testing Checklist

### Pre-Launch Testing

#### Authentication
- [ ] Sign up with email works
- [ ] Email verification works
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works
- [ ] OAuth providers work (if enabled)
- [ ] Session persistence works
- [ ] Protected routes redirect correctly

#### Core Functionality
- [ ] Project generation works
- [ ] Lyrics regeneration works
- [ ] Metatags regeneration works
- [ ] All generation modes work (custom, artist)
- [ ] All features work (instrumental, backing vocals, etc.)
- [ ] Copy to clipboard works

#### Database & Storage
- [ ] Projects save correctly
- [ ] Projects load correctly
- [ ] Projects update correctly
- [ ] Projects delete correctly
- [ ] RLS prevents unauthorized access
- [ ] Multi-device sync works
- [ ] Data persists after logout/login

#### User Features
- [ ] Dashboard displays projects
- [ ] Project sharing works
- [ ] Public project view works
- [ ] Private projects are protected
- [ ] Preferences save and apply
- [ ] Version history works (if implemented)

#### Monetization
- [ ] Usage tracking is accurate
- [ ] Limits enforce correctly
- [ ] Upgrade flow works
- [ ] Payment processes correctly
- [ ] Webhooks update subscription
- [ ] Downgrade works
- [ ] Cancellation works
- [ ] Usage dashboard accurate

#### Performance
- [ ] Page load times acceptable (<3s)
- [ ] API responses fast (<2s)
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Images optimized
- [ ] Bundle size reasonable

#### Security
- [ ] API keys not exposed
- [ ] RLS policies prevent data leaks
- [ ] CSRF protection enabled
- [ ] XSS prevention in place
- [ ] SQL injection not possible
- [ ] Rate limiting works
- [ ] Webhook signature verification works

---

## Cost Analysis

### Supabase Costs
**Free Tier Limits:**
- Database: 500MB
- Storage: 1GB
- Bandwidth: 2GB
- API Requests: 50,000/month
- Auth Users: Unlimited

**Pro Tier ($25/month):**
- Database: 8GB (+ $0.125/GB)
- Storage: 100GB (+ $0.021/GB)
- Bandwidth: 50GB (+ $0.09/GB)
- API Requests: Unlimited

**Estimated Costs (1000 users):**
- Database: ~2GB = Free or $25/month Pro
- Storage: ~5GB (projects) = Free or included in Pro
- Bandwidth: ~10GB = Free or included in Pro
- **Total: $0-25/month**

### AI API Costs

**Anthropic Claude (per 1M tokens):**
- Input: $3
- Output: $15

**OpenAI GPT-4 Turbo (per 1M tokens):**
- Input: $10
- Output: $30

**Estimated per Generation:**
- Input: ~1,000 tokens
- Output: ~800 tokens
- Cost: ~$0.015/generation (Claude)

**Monthly Costs (1000 users @ 10 gen/month):**
- Total generations: 10,000
- AI Costs: ~$150/month

### Stripe Costs
- 2.9% + $0.30 per transaction
- Monthly recurring: 0.5% additional
- **Example:** $19 subscription = $0.65 fee

### Total Monthly Costs Estimate

| Users | Supabase | AI Costs | Stripe Fees | Total |
|-------|----------|----------|-------------|-------|
| 100   | Free     | $15      | $10         | $25   |
| 500   | $25      | $75      | $50         | $150  |
| 1000  | $25      | $150     | $100        | $275  |
| 5000  | $50      | $750     | $500        | $1,300|

### Revenue Potential

**Conservative Estimates:**

| Users | Free | Pro ($19) | Enterprise ($99) | MRR |
|-------|------|-----------|------------------|-----|
| 1000  | 900  | 90 (9%)   | 10 (1%)          | $2,700 |
| 5000  | 4500 | 450 (9%)  | 50 (1%)          | $13,500 |

**Profit Margins:**
- 1000 users: $2,700 - $275 = $2,425 (89% margin)
- 5000 users: $13,500 - $1,300 = $12,200 (90% margin)

---

## Next Steps After Migration

### Marketing & Growth
1. Create landing page with value proposition
2. Add testimonials/social proof
3. Create demo video
4. Launch on Product Hunt
5. Content marketing (blog about music AI)
6. SEO optimization
7. Reddit/Discord community engagement

### Product Enhancements
1. Direct Suno API integration (when available)
2. Audio preview generation
3. Collaborative projects (team workspaces)
4. Advanced prompt templates library
5. AI-powered prompt suggestions
6. Export to various formats (PDF, Notion, etc.)
7. Mobile app (React Native)
8. Chrome extension for quick access

### Analytics & Monitoring
1. Set up Vercel Analytics
2. Add error tracking (Sentry)
3. User behavior analytics (PostHog/Mixpanel)
4. A/B testing framework
5. Performance monitoring
6. Conversion funnel tracking

---

## Support & Resources

### Supabase Documentation
- Auth: https://supabase.com/docs/guides/auth
- Database: https://supabase.com/docs/guides/database
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### Stripe Documentation
- Subscriptions: https://stripe.com/docs/billing/subscriptions
- Webhooks: https://stripe.com/docs/webhooks

### Community
- Supabase Discord: https://discord.supabase.com
- Next.js Discord: https://nextjs.org/discord

---

## Timeline Recommendation

### Week 1: Phase 1 (Auth)
- Days 1-2: Supabase setup + auth implementation
- Days 3-4: Testing + bug fixes
- Day 5: Deploy to staging

### Week 2: Phase 2 (Database)
- Days 1-2: Database schema + migration
- Days 3-4: Update API routes + frontend
- Day 5: Migration tool + testing

### Week 3: Phase 3 (Features)
- Days 1-2: Dashboard + sharing
- Days 3-4: Preferences + polish
- Day 5: Testing + deploy to production

### Week 4: Phase 4 (Monetization)
- Days 1-2: Stripe integration
- Days 3-4: Usage tracking + limits
- Day 5: Testing + launch

---

**Ready to start? Let's begin with Phase 1!**
