# Replit.md

## Overview

This is a full-stack web application built with a React frontend and Express.js backend, designed as a messaging channel interface called "Corp.OS Channel". The application follows a monorepo structure with shared types and schemas, providing a Telegram-like messaging experience with support for text, image, and video messages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for development and bundling
- **UI Theme**: Dark theme with custom Corp.OS branding

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local file system with multer for uploads
- **API**: RESTful API design
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Data Storage
- **Primary Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with type-safe queries
- **File Uploads**: Local filesystem storage in `/uploads` directory
- **In-Memory Fallback**: MemStorage class for development/testing

## Key Components

### Database Schema
- **Messages Table**: Stores message content, type (text/image/video), media URLs, view counts, and timestamps
- **Supported Message Types**: text, image, video
- **View Tracking**: Built-in view count functionality

### Frontend Components
- **Channel Page**: Main messaging interface with header, message feed, and composer
- **Message Feed**: Displays messages in chronological order with welcome message
- **Message Item**: Individual message component with media support and view tracking
- **Admin Composer**: Message creation interface with file upload support
- **UI Components**: Complete shadcn/ui component library integration

### Backend Routes
- `GET /api/messages`: Retrieve all messages
- `POST /api/messages`: Create text messages
- `POST /api/messages/upload`: Create messages with file uploads
- `POST /api/messages/:id/view`: Increment message view count
- `GET /uploads/*`: Static file serving for uploaded media

## Data Flow

1. **Message Creation**: User creates message via AdminComposer → API request to backend → Database storage → UI update via React Query
2. **Message Display**: Page load → Fetch messages from API → Display in MessageFeed component
3. **File Uploads**: File selection → FormData creation → Multer processing → File storage → Database record creation
4. **View Tracking**: User interaction → View increment API call → Database update → UI refresh

## External Dependencies

### Production Dependencies
- **UI Framework**: React, TypeScript, Vite
- **Database**: @neondatabase/serverless, drizzle-orm, drizzle-zod
- **File Handling**: multer for uploads
- **State Management**: @tanstack/react-query
- **UI Components**: Complete @radix-ui component set
- **Styling**: tailwindcss, class-variance-authority, clsx
- **Validation**: zod for schema validation
- **Date Handling**: date-fns

### Development Tools
- **Build**: esbuild for production builds
- **Database Management**: drizzle-kit for migrations
- **Development**: tsx for TypeScript execution

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations via `db:push` command

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **Node.js**: ESM module support
- **File System**: Write access for uploads directory

### Production Configuration
- **Static Files**: Express serves built frontend and uploaded files
- **Database**: PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed sessions
- **Error Handling**: Centralized error middleware with proper status codes

### Development Setup
- **Hot Reload**: Vite dev server with HMR
- **API Proxy**: Vite proxies API requests to Express server
- **File Watching**: tsx watches server files for changes
- **Database**: Local PostgreSQL or Neon database connection