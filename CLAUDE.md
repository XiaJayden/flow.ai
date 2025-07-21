# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flow.ai is a collaborative practice tool for musical bands that allows members to add synchronized annotations to YouTube songs. Band members can add instrument-specific notes at different timestamps and engage in threaded discussions about practice sections.

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with NextAuth.js authentication
- **Database**: SQLite with Prisma ORM
- **UI Components**: shadcn/ui with Radix UI primitives
- **Video**: YouTube API integration with react-youtube
- **Styling**: Tailwind CSS with custom design system

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Database operations
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio

# Build and deployment
npm run build
npm run start
npm run lint
```

## Project Structure

```
src/
├── app/                    # Next.js 13+ app router pages
│   ├── api/               # API routes for backend functionality
│   ├── auth/              # Authentication pages (signin/signup)
│   ├── bands/             # Band management and song practice pages
│   └── dashboard/         # User dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui style)
│   ├── navigation/       # Navigation components (Navbar)
│   ├── providers/        # Context providers (AuthProvider)
│   ├── player/           # YouTube player components
│   └── annotations/      # Annotation and comment components
├── lib/                  # Utilities and configurations
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client setup
│   ├── utils.ts         # Utility functions
│   └── youtube.ts       # YouTube API integration
└── types/               # TypeScript type definitions

prisma/                   # Database schema and migrations
```

## Core Data Models

- **User**: Email, username, name, password, instruments (JSON string)
- **Account/Session**: NextAuth.js authentication tables
- **Band**: Name, join code, creation date
- **BandMember**: User-band relationship with role and permissions
- **Song**: YouTube video metadata (title, artist, youtubeId, duration, thumbnail)
- **Annotation**: Timestamp-based notes with instrument tags and user association
- **Comment**: Threaded discussions on annotations

## Authentication System

- **NextAuth.js** with credentials provider
- **bcryptjs** for password hashing
- **Session-based** authentication with JWT
- **Role-based** permissions (admin/member) at band level
- **Protected API routes** with session validation

## Key Features Implemented

### ✅ **Authentication & User Management**
- User registration with instrument selection
- Secure login/logout with session management
- User profiles with instrument preferences
- Protected routes and API endpoints

### ✅ **Band Management**
- Band creation with unique join codes (8-character alphanumeric)
- Band joining via join codes
- Member management with role-based permissions
- Admin controls for band settings

### ✅ **YouTube Integration**
- YouTube video search via YouTube Data API v3
- Video metadata extraction (title, duration, thumbnail)
- URL parsing for various YouTube URL formats
- Song addition to band libraries

### ✅ **Song Practice System**
- Custom YouTube player with full controls
- Timestamp-based annotation system
- Instrument-specific note targeting
- Real-time annotation overlays during playback

### ✅ **Annotation & Discussion System**
- Timestamp-synchronized annotations
- Instrument tagging for targeted practice notes
- Threaded comment discussions on annotations
- User attribution and timestamps

## Development Notes

### Debugging
- Claude often is unable to independently judge if server is active. Claude should use curl commands to check if server is running.

### Database Considerations
- SQLite doesn't support arrays, so instruments are stored as JSON strings
- Use `parseInstruments()` and `stringifyInstruments()` utility functions
- All timestamps are stored as Float (seconds)
- Join codes are generated as 8-character uppercase alphanumeric strings

### API Patterns
- All API routes use session validation via `getServerSession()`
- Permission checks at band level (canView, canEdit, canInvite)
- Consistent error handling with proper HTTP status codes
- Data transformation for parsed instruments in responses

### Component Architecture
- Client components use `'use client'` directive
- Custom hooks for reusable logic
- Props interfaces for type safety
- Consistent UI patterns with shadcn/ui components

### YouTube Integration
- Requires YOUTUBE_API_KEY environment variable
- Video duration parsing from ISO 8601 format (PT4M13S)
- Thumbnail URL extraction from API responses
- Rate limiting considerations for API usage

## Environment Variables

Required in `.env`:
```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"
```

## Common Development Tasks

### Adding New UI Components
1. Create component in `src/components/ui/` following shadcn/ui patterns
2. Install any required Radix UI dependencies
3. Export from component file and import where needed

### Adding New API Routes
1. Create route file in `src/app/api/` following Next.js conventions
2. Implement session validation with `getServerSession()`
3. Add proper error handling and status codes
4. Include database operations with appropriate permissions

### Database Schema Changes
1. Update `prisma/schema.prisma`
2. Run `npm run db:push` to apply changes
3. Update TypeScript types if needed
4. Test with `npm run db:studio`

### Adding New Pages
1. Create page in `src/app/` following app router structure
2. Add authentication checks if required
3. Include proper navigation and error handling
4. Update navigation components if needed

## Testing Notes

- Test user registration and authentication flows
- Verify band creation and joining functionality
- Test YouTube search and video addition
- Check annotation creation and comment threading
- Validate permission systems and access controls

## Current Status: V1 MVP In Progress

✅ **Full Authentication System** - Registration, login, session management with instrument selection
✅ **Band Management** - Creation, joining with 8-character codes, member management
✅ **YouTube Integration** - Search, video selection, metadata extraction, URL parsing
✅ **Core UI Framework** - shadcn/ui components, navigation, dashboard

🔄 **V1 MVP Goals (Current Focus)**
- **YouTube Player Integration** - react-youtube player component
- **Annotation System** - Timestamp-based notes with instrument filtering
- **Sidebar Layout** - Annotations sidebar next to video player
- **Timeline View** - Horizontal timeline with annotation markers below video
- **Comment Threading** - Nested discussions on annotations
- **Click-to-Annotate** - Create annotations by clicking video timeline
- **Manual Timestamp Input** - Allow precise timestamp entry
- **Instrument Auto-Selection** - Use user's instruments from signup, allow switching

## Future Development Roadmap

🔄 **Streaming Integrations**
- **Spotify Integration** - Analyze recorded songs and band recordings
- **Chord Sheet Support** - PDF upload or built-in editor, Ultimate Guitar integration

🔄 **Band Organization Features**
- **Practice Scheduling** - Calendar integration, member availability
- **Setlist Management** - Song ordering, practice hierarchy
- **Song Priority System** - Mark songs needing more practice
- **Practice Session History** - Track progress and insights
- **Member Analytics** - Participation tracking, practice insights

🔄 **Advanced Features**
- **Real-time Synchronization** - Socket.io for synchronized playback
- **Mobile Responsiveness** - Optimize for mobile devices
- **Performance Optimization** - Lazy loading, caching strategies

## V1 User Workflow Vision

1. **In-Person Practice**: Band members collaboratively annotate during practice
2. **Individual Practice**: Members add personal notes and suggestions for other parts
3. **Next Practice**: All annotations and suggestions available for continued progress
4. **Instrument Focus**: Filter annotations by instrument for targeted practice