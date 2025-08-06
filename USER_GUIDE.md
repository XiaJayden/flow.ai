# Flow.ai User Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [File Structure Guide](#file-structure-guide)
5. [Customization Guide](#customization-guide)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Deployment](#deployment)
9. [Development Workflow](#development-workflow)

## Project Overview

Flow.ai is a collaborative practice tool for musical bands that enables synchronized annotations on YouTube songs. Band members can add timestamp-based notes, filter by instruments, and engage in threaded discussions about practice sections.

### Key Features
- **User Authentication** - Secure registration/login with instrument selection
- **Band Management** - Create/join bands with unique 8-character codes
- **YouTube Integration** - Search and add songs from YouTube
- **Annotation System** - Timestamp-based notes with instrument filtering
- **Real-time Player** - Custom YouTube player with synchronized controls
- **Threaded Comments** - Discussion system for each annotation
- **Instrument Color Coding** - Visual organization by instrument type

### Technology Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Backend**: Next.js API routes + NextAuth.js authentication
- **Database**: SQLite with Prisma ORM
- **Video Player**: YouTube API + react-youtube

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- YouTube Data API v3 key

### Installation
```bash
# Clone repository
git clone https://github.com/XiaJayden/flow.ai.git
cd flow.ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables
Create `.env` file:
```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"
```

### Development Commands
```bash
# Start development server
npm run dev

# Database operations
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:studio    # Open database GUI

# Build and deployment
npm run build
npm run start
npm run lint
```

## Core Features

### 1. User Authentication & Registration

**Location**: `/src/app/auth/`

Users register with email, username, password, and instrument selection. The system supports both email and username login.

**Key Files**:
- `signin/page.tsx` - Login interface
- `signup/page.tsx` - Registration with instrument selection
- `/src/app/api/auth/register/route.ts` - Registration API

### 2. Band Management

**Location**: `/src/app/bands/`

Bands are created with unique 8-character join codes. Members have roles (admin/member) with different permissions.

**Workflow**:
1. Create band → Generate unique join code
2. Share join code with band members
3. Members join using the code
4. Admin can manage members and songs

**Key Components**:
- `create/page.tsx` - Band creation form
- `join/page.tsx` - Join band interface
- `BandsList` component - Display user's bands

### 3. YouTube Song Integration

**Location**: `/src/lib/youtube.ts`

The system searches YouTube, extracts video metadata, and stores song information.

**Features**:
- YouTube URL parsing (multiple formats supported)
- Video metadata extraction (title, duration, thumbnail)
- Search functionality with music category filtering

**API Endpoints**:
- `/api/youtube/search` - Search YouTube videos
- `/api/bands/[id]/songs` - Add songs to band

### 4. Practice System

**Location**: `/src/components/practice/song-practice-page.tsx`

The main practice interface combines video player, annotations, and timeline.

**Components**:
- **YouTube Player** (`/src/components/player/youtube-player.tsx`)
  - Custom controls (play/pause, volume, seek)
  - Time tracking and synchronization
  - Keyboard shortcuts support

- **Annotation Timeline** (`/src/components/annotations/annotation-timeline.tsx`)
  - Visual timeline with annotation markers
  - Click-to-seek functionality
  - Grouped annotations for close timestamps

- **Annotation Sidebar** (`/src/components/annotations/annotation-sidebar.tsx`)
  - Filterable annotation list
  - Real-time search
  - Instrument-based filtering

### 5. Annotation System

**Location**: `/src/components/annotations/`

Timestamp-based notes with instrument tagging and threaded discussions.

**Features**:
- Precise timestamp entry (manual or current time)
- Multi-instrument tagging
- Content search and filtering
- Threaded comment system
- User attribution

**API Flow**:
1. Create annotation → `/api/songs/[id]/annotations` (POST)
2. Add comments → `/api/annotations/[id]/comments` (POST)
3. Fetch updates → Automatic refresh on actions

## File Structure Guide

### Core Application Structure

```
src/
├── app/                    # Next.js 13+ app router
│   ├── api/               # Backend API routes
│   ├── auth/              # Authentication pages
│   ├── bands/             # Band management
│   ├── dashboard/         # User dashboard
│   └── studio/            # Audio processing (experimental)
├── components/            # React components
├── lib/                   # Utilities and configuration
└── types/                 # TypeScript definitions
```

### Key Files Breakdown

#### Authentication System
- **`/src/lib/auth.ts`** - NextAuth configuration with credentials provider
- **`/src/app/api/auth/register/route.ts`** - User registration endpoint
- **`/src/components/auth/signin-form.tsx`** - Login form component
- **`/src/components/auth/signup-form.tsx`** - Registration form

#### Database Layer
- **`/prisma/schema.prisma`** - Database schema definition
- **`/src/lib/db.ts`** - Prisma client configuration
- **`/src/lib/utils.ts`** - Utility functions (instrument parsing, time formatting)

#### Band Management
- **`/src/app/api/bands/route.ts`** - Create/list bands
- **`/src/app/api/bands/join/route.ts`** - Join band by code
- **`/src/components/bands/create-band-modal.tsx`** - Band creation UI
- **`/src/components/bands/join-band-modal.tsx`** - Join band UI

#### YouTube Integration
- **`/src/lib/youtube.ts`** - YouTube API wrapper functions
- **`/src/app/api/youtube/search/route.ts`** - YouTube search endpoint
- **`/src/components/songs/add-song-modal.tsx`** - Song addition interface

#### Player System
- **`/src/components/player/youtube-player.tsx`** - Custom YouTube player
- **`/src/components/practice/song-practice-page.tsx`** - Main practice interface

#### Annotation System
- **`/src/components/annotations/annotation-sidebar.tsx`** - Annotation management
- **`/src/components/annotations/annotation-timeline.tsx`** - Visual timeline
- **`/src/components/annotations/create-annotation-form.tsx`** - Annotation creation
- **`/src/app/api/songs/[id]/annotations/route.ts`** - Annotation CRUD API

#### UI Components
- **`/src/components/ui/`** - shadcn/ui component library
- **`/src/lib/constants.ts`** - Instrument definitions and color schemes

### Configuration Files
- **`next.config.js`** - Next.js configuration (YouTube domain allowlist)
- **`tailwind.config.js`** - Tailwind CSS customization
- **`package.json`** - Dependencies and scripts

## Customization Guide

### Adding New Instruments

**1. Update Constants** (`/src/lib/constants.ts`):
```typescript
export const INSTRUMENTS = [
  'Guitar', 'Bass', 'Drums', 'Vocals', 'Piano',
  'YourNewInstrument', // Add here
  // ... rest
] as const;

export const INSTRUMENT_EMOJIS: Record<string, string> = {
  // Add emoji mapping
  'YourNewInstrument': '🎵',
  // ... rest
};

export const DEFAULT_INSTRUMENT_COLORS: Record<string, string> = {
  // Add default color
  'YourNewInstrument': '#your-hex-color',
  // ... rest
};
```

**2. Update Database** (if needed):
The instrument system uses JSON arrays, so new instruments are automatically supported.

### Customizing UI Colors

**Instrument Colors** (`/src/lib/constants.ts`):
- Modify `DEFAULT_INSTRUMENT_COLORS` for default colors
- Add colors to `COLOR_OPTIONS` for user customization palette

**Theme Colors** (`tailwind.config.js`):
```javascript
theme: {
  extend: {
    colors: {
      primary: "your-primary-color",
      // ... other theme colors
    }
  }
}
```

### Adding New API Endpoints

**1. Create Route File**: `/src/app/api/your-endpoint/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your logic here
  
  return NextResponse.json({ data: 'your-data' })
}
```

**2. Add Type Definitions** (`/src/types/index.ts`):
```typescript
export interface YourNewType {
  id: string
  // ... your properties
}
```

### Customizing Player Behavior

**YouTube Player** (`/src/components/player/youtube-player.tsx`):
- Modify `opts` object for player configuration
- Add custom keyboard shortcuts in event handlers
- Adjust time tracking interval (currently 200ms)

**Timeline** (`/src/components/annotations/annotation-timeline.tsx`):
- Change annotation grouping threshold (currently 5 seconds)
- Modify marker appearance and behavior
- Customize tooltip content

### Database Schema Changes

**1. Update Schema** (`/prisma/schema.prisma`):
```prisma
model YourNewModel {
  id        String   @id @default(cuid())
  // ... your fields
  createdAt DateTime @default(now())
}
```

**2. Generate and Push**:
```bash
npm run db:generate
npm run db:push
```

**3. Update Types** (`/src/types/index.ts`):
Import and extend Prisma types as needed.

## API Reference

### Authentication Endpoints

#### POST `/api/auth/register`
Register new user with instruments.
```json
{
  "email": "user@example.com",
  "username": "username",
  "name": "Display Name",
  "password": "password",
  "instruments": ["Guitar", "Vocals"]
}
```

### Band Management Endpoints

#### POST `/api/bands`
Create new band.
```json
{
  "name": "My Band"
}
```

#### GET `/api/bands`
Get user's bands with member/song counts.

#### POST `/api/bands/join`
Join band by code.
```json
{
  "joinCode": "ABC12345"
}
```

### Song Management Endpoints

#### POST `/api/bands/[id]/songs`
Add song to band.
```json
{
  "youtubeUrl": "https://youtube.com/watch?v=VIDEO_ID"
}
```

#### GET `/api/youtube/search`
Search YouTube videos.
```
GET /api/youtube/search?q=search+query
```

### Annotation Endpoints

#### POST `/api/songs/[id]/annotations`
Create annotation.
```json
{
  "content": "This is where the guitar solo starts",
  "timestamp": 120.5,
  "instruments": ["Guitar", "Drums"]
}
```

#### GET `/api/songs/[id]/annotations`
Get all annotations for song with comments.

#### POST `/api/annotations/[id]/comments`
Add comment to annotation.
```json
{
  "content": "Great point! Let's work on this section."
}
```

### Response Formats

All API responses follow this structure:
```json
{
  "data": "response-data",
  "error": "error-message (if applicable)"
}
```

Error responses include appropriate HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Database Schema

### Core Models

#### User
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  username    String   @unique
  name        String?
  password    String
  instruments String   // JSON array: ["Guitar", "Bass"]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Band
```prisma
model Band {
  id        String   @id @default(cuid())
  name      String
  joinCode  String   @unique  // 8-char alphanumeric
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### BandMember
```prisma
model BandMember {
  id       String @id @default(cuid())
  userId   String
  bandId   String
  role     String @default("member")  // "admin" | "member"
  joinedAt DateTime @default(now())
  
  @@unique([userId, bandId])
}
```

#### Song
```prisma
model Song {
  id          String   @id @default(cuid())
  bandId      String
  title       String
  artist      String?
  youtubeId   String
  duration    Float    // seconds
  thumbnail   String?
  instruments String   @default("[]")  // JSON array
  addedAt     DateTime @default(now())
  
  @@unique([bandId, youtubeId])
}
```

#### Annotation
```prisma
model Annotation {
  id          String   @id @default(cuid())
  songId      String
  userId      String
  timestamp   Float    // seconds
  content     String
  instruments String   // JSON array
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Comment
```prisma
model Comment {
  id           String   @id @default(cuid())
  annotationId String
  userId       String
  content      String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Key Design Decisions

**JSON Storage**: Instruments are stored as JSON strings in SQLite to work around array limitations.

**Unique Constraints**: 
- Users: email and username must be unique
- Bands: joinCode must be unique
- Songs: bandId + youtubeId must be unique (prevents duplicates)
- BandMembers: userId + bandId must be unique (prevents double-joining)

**Cascading Deletes**: Most relationships use `onDelete: Cascade` to maintain data integrity.

## Deployment

### Hosting Options

#### Recommended: Vercel + Turso
- **Vercel**: Optimized for Next.js, generous free tier
- **Turso**: SQLite-based database with global edge locations
- **Cost**: Free tier covers most needs, scales affordably

#### Alternative Options
1. **Railway**: Full-stack platform, $5/month includes database
2. **Render**: Free tier available, easy deployment
3. **Fly.io**: Pay-as-you-go, very affordable
4. **Netlify + Supabase**: Static hosting + PostgreSQL backend

### Environment Setup

**Production Environment Variables**:
```bash
# Database (update for production)
DATABASE_URL="your-production-database-url"

# NextAuth (use production domain)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="secure-random-string-64-chars"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"
```

### Database Migration

**SQLite to PostgreSQL** (if needed):
1. Update `schema.prisma` datasource to PostgreSQL
2. Replace SQLite-specific syntax if any
3. Run `npx prisma migrate dev` to create migrations
4. Deploy with database provider

### Build Configuration

**Next.js Configuration** (`next.config.js`):
```javascript
const nextConfig = {
  images: {
    domains: ['img.youtube.com'], // YouTube thumbnails
  },
  // Production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
```

### Performance Optimizations

1. **Image Optimization**: YouTube thumbnails are optimized via Next.js Image component
2. **Bundle Splitting**: Webpack configuration splits vendor bundles
3. **Database Indexing**: Key fields are indexed in Prisma schema
4. **Component Lazy Loading**: Large components use dynamic imports

## Development Workflow

### Code Organization

**Component Structure**:
```typescript
// Component file structure
'use client'  // Client component directive

import { /* dependencies */ } from 'libraries'
import { /* local imports */ } from '@/local/paths'

interface ComponentProps {
  // TypeScript interface
}

export function Component({ props }: ComponentProps) {
  // Component logic
  return (
    // JSX
  )
}
```

**API Route Structure**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET/POST/PUT/DELETE(request: NextRequest) {
  // 1. Authentication check
  // 2. Input validation
  // 3. Database operations
  // 4. Response formatting
}
```

### Testing Strategy

**Manual Testing Checklist**:
1. User registration/login flow
2. Band creation and joining
3. Song addition and YouTube integration
4. Annotation creation and editing
5. Comment threading
6. Instrument filtering
7. Timeline synchronization

**API Testing**:
Use tools like Postman or curl to test endpoints with proper authentication headers.

### Debugging

**Common Issues**:

1. **YouTube API Errors**: Check API key validity and quota limits
2. **Database Connection**: Verify DATABASE_URL format
3. **Authentication Issues**: Check NEXTAUTH_SECRET and session configuration
4. **Build Errors**: Usually TypeScript or import path issues

**Development Tools**:
- `npm run db:studio` - Visual database browser
- Browser DevTools - Network tab for API debugging
- Next.js built-in error overlay

### Version Control

**Git Workflow**:
```bash
# Feature development
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature

# Create pull request for review
```

**Important Files to Track**:
- All source code in `/src`
- Configuration files (`next.config.js`, `tailwind.config.js`)
- Database schema (`prisma/schema.prisma`)
- Package definitions (`package.json`)

**Files to Ignore** (in `.gitignore`):
- `.env` (environment variables)
- `node_modules/`
- `.next/`
- Database files (`*.db`)

### Performance Monitoring

**Key Metrics to Watch**:
- Page load times (especially practice page)
- API response times
- YouTube player initialization
- Database query performance
- Bundle size and lighthouse scores

### Contributing Guidelines

1. **Code Style**: Follow existing patterns and TypeScript conventions
2. **Component Design**: Keep components focused and reusable
3. **API Design**: Maintain consistent error handling and response formats
4. **Security**: Always validate user input and check authentication
5. **Performance**: Consider mobile users and slower connections

---

## Quick Reference

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Update database schema
npm run db:studio    # Open database GUI
npm run lint         # Check code quality
```

### Key URLs (Development)
- Application: http://localhost:3000
- Database Studio: http://localhost:5555 (when running db:studio)

### Important Environment Variables
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Authentication secret (64+ characters)
- `YOUTUBE_API_KEY` - YouTube Data API v3 key
- `NEXTAUTH_URL` - Application URL (for production)

This guide covers the essential aspects of the Flow.ai application. For specific implementation details, refer to the actual source code files mentioned throughout this documentation.