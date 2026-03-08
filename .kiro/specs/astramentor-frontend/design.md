# Design Document: AstraMentor Frontend

## Overview

AstraMentor is a Next.js 14 application built with TypeScript, leveraging the App Router architecture and React Server Components. The frontend provides an integrated development environment with Monaco Editor, real-time SSE streaming for AI agent responses, interactive knowledge graph visualization, and comprehensive code verification capabilities.

The architecture follows a modular, component-based design with clear separation between presentation, business logic, and data fetching. State management is split between Zustand (client state) and TanStack Query (server state) to optimize performance and developer experience.

### Key Design Principles

1. **Performance First**: Code splitting, lazy loading, virtualization for large lists
2. **Type Safety**: Strict TypeScript with generated API types from OpenAPI spec
3. **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support
4. **Resilience**: Graceful error handling, automatic reconnection, offline capability
5. **Developer Experience**: Hot reload, clear error messages, comprehensive testing

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App Router                    │
├─────────────────────────────────────────────────────────────┤
│  Landing Page  │  Auth Pages  │  Dashboard  │  Workspace    │
├─────────────────────────────────────────────────────────────┤
│                     Layout Components                        │
│  ├─ Topbar (repo selector, session, user menu)             │
│  ├─ Sidebar (file tree, session history)                   │
│  └─ Command Palette (keyboard-driven actions)              │
├─────────────────────────────────────────────────────────────┤
│                    Feature Components                        │
│  ├─ Monaco Editor (code editing, gutter hints)             │
│  ├─ Chat Panel (SSE streaming, evidence cards)             │
│  ├─ Knowledge Graph (React Flow visualization)             │
│  └─ Verifier Panel (test results, coverage)                │
├─────────────────────────────────────────────────────────────┤
│                    State Management                          │
│  ├─ Zustand Stores (UI state, editor state)                │
│  └─ TanStack Query (API data, caching)                     │
├─────────────────────────────────────────────────────────────┤
│                    API Integration Layer                     │
│  ├─ Axios Client (REST API)                                │
│  ├─ EventSource (SSE streaming)                            │
│  └─ AWS Amplify (Cognito auth)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Backend REST + SSE API
```

### Directory Structure

```
astramentor-frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/              # Protected route group
│   │   │   ├── workspace/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── editor/                   # Monaco editor components
│   │   ├── chat/                     # Chat panel components
│   │   ├── graph/                    # Knowledge graph components
│   │   ├── verifier/                 # Verifier panel components
│   │   └── layout/                   # Layout components
│   ├── lib/                          # Utilities and configurations
│   │   ├── api/                      # API client and types
│   │   ├── auth/                     # Auth utilities
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── stores/                   # Zustand stores
│   │   └── utils/                    # Helper functions
│   ├── styles/                       # Global styles
│   └── types/                        # TypeScript type definitions
├── public/                           # Static assets
├── tests/                            # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── package.json
```

### Technology Stack Rationale

- **Next.js 14 App Router**: Server Components for better performance, built-in routing, API routes
- **TypeScript 5.x**: Type safety, better IDE support, reduced runtime errors
- **Tailwind CSS + shadcn/ui**: Rapid UI development, consistent design system, accessibility built-in
- **Zustand**: Lightweight state management, minimal boilerplate, excellent TypeScript support
- **TanStack Query**: Declarative data fetching, automatic caching, background refetching
- **Monaco Editor**: Industry-standard code editor, VS Code foundation, extensive language support
- **React Flow**: Performant graph visualization, customizable nodes/edges, built-in controls
- **AWS Amplify v6**: Simplified Cognito integration, automatic token refresh, secure storage

## Components and Interfaces

### Authentication Module

**Components:**
- `LoginForm`: Email/password authentication form
- `RegisterForm`: User registration with validation
- `OAuthButtons`: Social login providers (Google, GitHub)
- `AuthGuard`: Route protection HOC

**Key Interfaces:**

```typescript
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  name: string;
  skillLevel: SkillLevel;
  preferences: UserPreferences;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

type OAuthProvider = 'google' | 'github';
type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
```

**Authentication Flow:**

1. User submits credentials via `LoginForm`
2. `AuthState.login()` calls AWS Amplify `signIn()`
3. Amplify returns tokens and user data
4. Tokens stored in httpOnly cookies (preferred) or secure localStorage
5. User object stored in Zustand state
6. Redirect to dashboard
7. `AuthGuard` protects routes by checking `isAuthenticated`
8. Axios interceptor adds token to requests
9. On 401 response, attempt `refreshToken()`
10. If refresh fails, logout and redirect to login

### Monaco Editor Integration

**Components:**
- `CodeEditor`: Main Monaco wrapper component
- `GutterHint`: AI hint decoration in editor margin
- `HintPopover`: Detailed explanation on hint click
- `EditorToolbar`: File tabs, actions, settings

**Key Interfaces:**

```typescript
interface EditorState {
  content: string;
  language: string;
  cursorPosition: Position;
  selection: Range | null;
  isDirty: boolean;
  hints: EditorHint[];
  setContent: (content: string) => void;
  updateCursor: (position: Position) => void;
  addHint: (hint: EditorHint) => void;
  clearHints: () => void;
}

interface EditorHint {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
  source: 'ai' | 'linter';
}

interface Position {
  line: number;
  column: number;
}

interface Range {
  start: Position;
  end: Position;
}
```

**Editor Integration:**

1. Monaco loaded via dynamic import for code splitting
2. Editor instance created with configuration (theme, font, language)
3. Language support loaded on-demand based on file extension
4. Gutter decorations added via `editor.deltaDecorations()`
5. Hover providers registered for hint popovers
6. Context menu extended with "Ask about selection"
7. Editor state synced to Zustand store on change
8. Content persisted to localStorage on debounced change (500ms)

### SSE Streaming Chat

**Components:**
- `ChatPanel`: Main chat container
- `MessageList`: Virtualized message list
- `MessageBubble`: Individual message with agent avatar
- `EvidenceCard`: Code reference with file/line info
- `InputBar`: Message input with send button
- `SuggestedQuestions`: Clickable question chips

**Key Interfaces:**

```typescript
interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStream: EventSource | null;
  addMessage: (message: Message) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStream: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentType?: AgentType;
  evidence?: Evidence[];
  timestamp: number;
  isComplete: boolean;
}

interface Evidence {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  explanation: string;
}

type AgentType = 'tutor' | 'architect' | 'debugger' | 'optimizer';
```

**SSE Streaming Flow:**

1. User submits message via `InputBar`
2. `ChatState.sendMessage()` creates user message
3. POST to `/api/v1/ask` with message and session context
4. Backend returns 200 with SSE stream URL
5. Create `EventSource` connection to stream URL
6. Listen for `message` events
7. Parse JSON chunks: `{ type: 'delta', agent: 'tutor', content: '...' }`
8. Append content to current assistant message
9. On `{ type: 'evidence', ... }`, add evidence 