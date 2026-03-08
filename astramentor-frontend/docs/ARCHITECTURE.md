# Architecture Documentation - AstraMentor Frontend

## Overview

AstraMentor is a modern web application built with Next.js 14, TypeScript, and React. This document provides a comprehensive overview of the application architecture, design decisions, and technical implementation.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
├─────────────────────────────────────────────────────────────┤
│                     Next.js 14 Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages &    │  │  Components  │  │    Stores    │     │
│  │   Layouts    │  │   (React)    │  │  (Zustand)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   API Layer  │  │    Hooks     │  │    Utils     │     │
│  │   (Axios)    │  │   (Custom)   │  │  (Helpers)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Backend    │  │     AWS      │  │   Monaco     │     │
│  │     API      │  │   Cognito    │  │   Editor     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
astramentor-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── accessibility/     # A11y components
│   │   ├── auth/              # Authentication components
│   │   ├── chat/              # Chat interface
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── editor/            # Code editor
│   │   ├── error/             # Error boundaries
│   │   ├── graph/             # Knowledge graph
│   │   ├── landing/           # Landing page sections
│   │   ├── layout/            # Layout components
│   │   ├── loading/           # Loading skeletons
│   │   ├── providers/         # Context providers
│   │   ├── repo/              # Repository management
│   │   ├── settings/          # Settings panels
│   │   ├── ui/                # shadcn/ui components
│   │   ├── verifier/          # Test verification
│   │   └── workspace/         # Workspace layout
│   ├── lib/                   # Core libraries
│   │   ├── api/               # API client & endpoints
│   │   ├── auth/              # Auth utilities
│   │   ├── hooks/             # Custom React hooks
│   │   ├── query/             # TanStack Query setup
│   │   ├── stores/            # Zustand stores
│   │   └── utils/             # Utility functions
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── .github/                   # GitHub Actions
├── docs/                      # Documentation
└── [config files]             # Various config files
```

---

## 🎯 Core Technologies

### Frontend Framework
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with concurrent features
- **TypeScript 5**: Type-safe development

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library
- **Lucide React**: Icon library

### State Management
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management
- **React Context**: Theme and providers

### Authentication
- **AWS Amplify v6**: Authentication SDK
- **AWS Cognito**: User management
- **OAuth 2.0**: Social login (Google, GitHub)

### Code Editor
- **Monaco Editor**: VS Code editor component
- **@monaco-editor/react**: React wrapper

### Data Visualization
- **React Flow**: Knowledge graph visualization
- **Recharts**: Charts and graphs (if needed)

---

## 🔄 Data Flow

### 1. Authentication Flow
```
User → Login Form → AWS Cognito → JWT Tokens → Auth Store → Protected Routes
```

### 2. API Request Flow
```
Component → Custom Hook → TanStack Query → Axios Client → Backend API
                                              ↓
                                         Auth Interceptor
                                              ↓
                                         Error Handler
```

### 3. Real-time Chat Flow
```
User Input → Chat Store → API Request → SSE Stream → Message Updates → UI
```

### 4. State Management Flow
```
User Action → Component → Zustand Store → Subscribers → Re-render
```

---

## 🗂️ State Management Strategy

### Zustand Stores

#### 1. Auth Store (`auth-store.ts`)
- User authentication state
- Token management
- Login/logout actions
- OAuth integration

#### 2. UI Store (`ui-store.ts`)
- Theme (light/dark)
- Panel sizes and visibility
- Command palette state
- Sidebar collapsed state

#### 3. Editor Store (`editor-store.ts`)
- Editor content
- Cursor position
- Language mode
- Hints and decorations
- Navigation targets

#### 4. Chat Store (`chat-store.ts`)
- Messages array
- Streaming state
- Current session
- Draft input

#### 5. Settings Store (`settings-store.ts`)
- User preferences
- Skill level
- Socratic mode
- Editor settings

### TanStack Query

Used for server state management:
- Repository data
- Session history
- Graph data
- User profile
- Test results

---

## 🎨 Component Architecture

### Component Hierarchy

```
App Layout
├── Error Boundary
├── Theme Provider
├── Query Provider
└── Page Layout
    ├── TopBar
    │   ├── Repository Selector
    │   ├── Session Controls
    │   └── User Menu
    ├── Sidebar
    │   ├── File Tree
    │   └── Session History
    └── Main Content
        ├── Workspace (3-panel)
        │   ├── Editor Panel
        │   ├── Chat Panel
        │   └── Verifier Panel
        ├── Dashboard
        │   ├── Quick Actions
        │   ├── Recent Sessions
        │   └── Activity Feed
        └── Graph
            ├── React Flow Canvas
            └── Node Detail Panel
```

### Component Patterns

#### 1. Container/Presentational
```tsx
// Container: Logic and state
export function ChatPanelContainer() {
  const { messages, sendMessage } = useChatStore();
  return <ChatPanel messages={messages} onSend={sendMessage} />;
}

// Presentational: UI only
export function ChatPanel({ messages, onSend }) {
  return <div>{/* UI */}</div>;
}
```

#### 2. Compound Components
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### 3. Render Props
```tsx
<ErrorBoundary fallback={(error) => <ErrorUI error={error} />}>
  {children}
</ErrorBoundary>
```

---

## 🔌 API Integration

### API Client Setup

```typescript
// Base Axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken();
      return apiClient.request(error.config);
    }
    throw error;
  }
);
```

### Endpoint Organization

```typescript
// src/lib/api/endpoints.ts
export const endpoints = {
  auth: {
    login: (data) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
  },
  chat: {
    askQuestion: (data) => apiClient.post('/chat/ask', data),
    getSessions: () => apiClient.get('/chat/sessions'),
  },
  repo: {
    upload: (file) => apiClient.post('/repo/upload', file),
    getStatus: (id) => apiClient.get(`/repo/${id}/status`),
  },
};
```

---

## 🎭 Routing Strategy

### App Router Structure

```
app/
├── (auth)/                    # Auth layout group
│   ├── login/page.tsx        # /login
│   ├── register/page.tsx     # /register
│   └── callback/page.tsx     # /callback
├── (dashboard)/              # Dashboard layout group
│   ├── layout.tsx            # Protected layout
│   ├── page.tsx              # /dashboard
│   ├── workspace/page.tsx    # /workspace
│   ├── graph/page.tsx        # /graph
│   └── settings/page.tsx     # /settings
├── layout.tsx                # Root layout
└── page.tsx                  # / (landing)
```

### Route Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard');
  
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

---

## 🔐 Security Considerations

### 1. Authentication
- JWT tokens stored in httpOnly cookies
- Token refresh mechanism
- Automatic logout on token expiry
- OAuth 2.0 for social login

### 2. Authorization
- Route-level protection (middleware)
- Component-level guards (AuthGuard)
- API request authentication

### 3. Data Validation
- Zod schemas for all inputs
- API response validation
- Type-safe throughout

### 4. XSS Prevention
- React's built-in escaping
- Sanitize user-generated content
- Content Security Policy headers

### 5. CSRF Protection
- SameSite cookies
- CSRF tokens for mutations
- Origin validation

---

## 🚀 Performance Optimizations

### 1. Code Splitting
- Dynamic imports for heavy components
- Route-based splitting (automatic with Next.js)
- Lazy loading for Monaco Editor

### 2. Caching
- TanStack Query caching
- Browser caching for static assets
- Service worker for offline support

### 3. Bundle Optimization
- Tree shaking
- Minification
- Compression (gzip/brotli)

### 4. Image Optimization
- Next.js Image component
- WebP format
- Responsive images

### 5. Rendering Strategy
- Static generation for landing page
- Server-side rendering for dashboard
- Client-side rendering for interactive features

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Component logic
- Utility functions
- Store actions
- API client

### Integration Tests
- Component interactions
- Store + API integration
- Form submissions

### E2E Tests (Playwright)
- User flows
- Authentication
- Critical paths

---

## 📦 Build & Deployment

### Development
```bash
npm run dev          # Start dev server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

### Production
```bash
npm run build        # Build for production
npm start            # Start production server
```

### Docker
```bash
docker-compose up    # Run in container
```

### Vercel
```bash
vercel --prod        # Deploy to Vercel
```

---

## 🔧 Configuration Files

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Path aliases (@/)
- ES2020 target

### Tailwind (`tailwind.config.ts`)
- Custom colors
- Custom spacing
- Plugin configuration

### Next.js (`next.config.js`)
- Security headers
- Image optimization
- Environment variables

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)

---

**Last Updated:** March 1, 2026

