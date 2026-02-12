# School Assessment & Examination System

## Overview

A comprehensive, production-grade school assessment and examination platform built with modern web technologies. The system provides three distinct portals (Student, Teacher, and Admin) with features including exam creation and management, real-time exam monitoring, anti-cheating mechanisms, performance analytics, and a complete question bank system. The platform supports multiple question types (MCQ, MSQ, Numeric, True/False) and includes advanced exam security features like full-screen enforcement, tab-change detection, and focus-loss logging.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server with HMR (Hot Module Replacement)
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** (React Query) for server state management and data fetching

**UI Component Library**
- **shadcn/ui** component system based on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **New York** style variant with Material Design principles
- Custom color system using HSL values with CSS variables for theming
- Typography: Inter for UI text, Roboto Mono for numeric data

**Design System**
- Clarity-focused approach with minimal visual noise
- Consistent spacing primitives (2, 4, 6, 8, 12, 16 Tailwind units)
- Responsive containers with max-width constraints
- Grid-based dashboard layouts
- Generous whitespace in exam interfaces to reduce cognitive load

**State Management Strategy**
- Server state: TanStack Query with custom query functions
- Authentication state: React Context API (AuthContext)
- Form state: React Hook Form with Zod validation (@hookform/resolvers)
- Local UI state: React hooks (useState, useReducer)

**Route Protection**
- `ProtectedRoute` component for role-based access control
- Three-tier role system: student, teacher, admin
- Automatic redirects based on user role and authentication status

### Backend Architecture

**Server Framework**
- **Express.js** on Node.js with TypeScript
- Custom development/production server setup with separate entry points
- Request logging middleware with timestamp formatting
- Cookie-based session management using `cookie-parser`

**Authentication & Authorization**
- JWT (JSON Web Token) for stateless authentication
- bcrypt for password hashing (10 salt rounds)
- Token stored in both HTTP-only cookies and Authorization headers
- Middleware-based route protection with role validation
- Session secret configurable via environment variable

**API Design**
- RESTful API structure with `/api` prefix
- Centralized route registration in `server/routes.ts`
- Express Request extension for authenticated user context
- Structured error responses with appropriate HTTP status codes

**Data Access Layer**
- Storage abstraction through `IStorage` interface
- Repository pattern implementation in `server/storage.ts`
- Separation of database operations from route handlers
- Support for complex queries with joins and aggregations

### Database Design

**ORM & Migrations**
- **Drizzle ORM** with PostgreSQL dialect
- Type-safe schema definitions in `shared/schema.ts`
- Migration files output to `./migrations` directory
- Schema shared between frontend and backend for type consistency

**Core Data Models**

1. **Users Table**
   - Primary key: UUID (auto-generated)
   - Role-based access: student, teacher, admin (pgEnum)
   - Password hashing required before storage
   - Unique constraints on username and email

2. **Classes & Enrollment**
   - Classes linked to teacher users
   - Many-to-many relationship via `studentClasses` junction table
   - Enrollment tracking with timestamps

3. **Exams System**
   - Exam metadata: title, description, duration, marks
   - Status enum: draft, scheduled, active, completed, cancelled
   - Support for shuffling questions/options
   - Scheduling with start/end timestamps
   - Full-screen enforcement flag

4. **Question Bank**
   - Question types: MCQ, MSQ, numeric, true_false (pgEnum)
   - Separate `questionOptions` table for choice-based questions
   - `numericAnswers` table for numeric question types
   - Subject categorization and difficulty levels
   - Marks allocation per question

5. **Exam Attempts & Responses**
   - Student exam attempts with start/end times and scores
   - Individual student answers with response tracking
   - Auto-submit capability on time expiration

6. **Security & Monitoring**
   - `activityLogs`: Tab changes, focus loss, full-screen exits, page reloads
   - `cheatingLogs`: Flagged suspicious activities with severity levels
   - Timestamp tracking for all security events

7. **System Configuration**
   - `systemSettings` table for application-wide configuration
   - Key-value storage with JSON value support

**Drizzle Relations**
- Defined relationships between tables using Drizzle's relations API
- Type-safe joins and nested queries
- Schema validation using drizzle-zod integration

### External Dependencies

**Database Provider**
- **Neon Serverless PostgreSQL** via `@neondatabase/serverless`
- WebSocket-based connection pooling using `ws` library
- Connection string from `DATABASE_URL` environment variable
- Automatic connection pool management

**UI Component Primitives**
- **Radix UI** components for accessible, unstyled primitives:
  - Dialogs, Dropdowns, Popovers, Tooltips
  - Form controls: Checkbox, Radio, Select, Switch, Slider
  - Navigation: Accordion, Tabs, Menubar, Context Menu
  - Overlays: Alert Dialog, Hover Card, Toast
  - Layout: Scroll Area, Separator, Collapsible

**Styling & Utilities**
- **Tailwind CSS** with PostCSS and Autoprefixer
- **class-variance-authority** for component variant management
- **clsx** and **tailwind-merge** for conditional class composition
- Custom CSS variables for color theming and shadows

**Form Handling**
- **React Hook Form** for performant form state management
- **Zod** schema validation
- **@hookform/resolvers** for validation integration

**Development Tools**
- **tsx** for TypeScript execution in development
- **esbuild** for production server bundling
- **Replit plugins**: Runtime error modal, cartographer, dev banner
- Vite plugins for enhanced development experience

**Session Management**
- **connect-pg-simple** for PostgreSQL-backed session store
- Cookie-based session persistence

**Security Dependencies**
- **jsonwebtoken** for JWT creation and verification
- **bcrypt** for secure password hashing
- Type definitions via @types packages

**Font Loading**
- Google Fonts: Inter (weights 300-700) and Roboto Mono (weights 400-700)
- Preconnect optimization for faster font loading

### Build & Deployment Strategy

**Development Mode**
- Vite dev server with middleware mode
- Dynamic HTML template injection with cache-busting
- File watching and HMR for instant updates
- TypeScript checking without emitting files

**Production Build**
- Client: Vite build to `dist/public`
- Server: esbuild bundle to `dist/index.js`
- ESM format with external packages
- Static file serving from build directory

**Environment Configuration**
- `NODE_ENV` for development/production switching
- `DATABASE_URL` for database connection (required)
- `SESSION_SECRET` for JWT signing (defaults provided, should be overridden)
- Separate index files for dev/prod environments

**Path Aliases**
- `@/*` → `client/src/*` for frontend code
- `@shared/*` → `shared/*` for shared types/schemas
- `@assets/*` → `attached_assets/*` for static assets