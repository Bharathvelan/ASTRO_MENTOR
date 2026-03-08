# AstraMentor Frontend

> AI-Powered Socratic Learning Platform for Code Education

AstraMentor is a multi-agent AI tutoring system that helps developers learn to code through Socratic dialogue, real-time code analysis, and intelligent feedback. Built with Next.js 14, TypeScript, and modern web technologies.

## ✨ Features

- **🤖 AI-Powered Tutoring**: Multi-agent system with specialized tutors (Tutor, Architect, Debugger, Optimizer)
- **💬 Real-time Chat**: Streaming responses with Server-Sent Events (SSE)
- **📝 Monaco Code Editor**: Full-featured code editor with syntax highlighting and IntelliSense
- **🔍 Knowledge Graph**: Interactive visualization of code structure and relationships
- **✅ Code Verification**: Automated test execution and results display
- **📊 Socratic Mode**: Progressive hint system adapted to skill level
- **🎨 Modern UI**: Responsive design with light/dark themes
- **🔐 Secure Authentication**: AWS Cognito with OAuth support (Google, GitHub)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm/yarn
- **AWS Account** (for Cognito authentication)
- **Backend API** running (see backend repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd astramentor-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
   NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
   NEXT_PUBLIC_COGNITO_REGION=us-east-1
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
npm run format       # Format code with Prettier

# API Types
npm run generate:api-types  # Generate TypeScript types from OpenAPI spec
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Authentication**: AWS Amplify v6 + Cognito
- **Code Editor**: Monaco Editor
- **Graph Visualization**: React Flow
- **Icons**: Lucide React

### Project Structure

```
astramentor-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── chat/             # Chat panel components
│   │   ├── editor/           # Monaco editor components
│   │   ├── graph/            # Knowledge graph components
│   │   ├── layout/           # Layout components
│   │   ├── repo/             # Repository management
│   │   ├── settings/         # Settings components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── verifier/         # Code verification
│   │   └── workspace/        # Workspace layout
│   ├── lib/                   # Utilities and configurations
│   │   ├── api/              # API client and endpoints
│   │   ├── auth/             # Authentication utilities
│   │   ├── hooks/            # Custom React hooks
│   │   ├── query/            # TanStack Query setup
│   │   ├── stores/           # Zustand stores
│   │   └── utils/            # Helper functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── .env.example              # Environment variables template
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

### Key Components

#### Authentication Flow
1. User logs in via email/password or OAuth (Google/GitHub)
2. AWS Cognito issues JWT tokens
3. Tokens stored securely and attached to API requests
4. Automatic token refresh on expiry

#### Chat System
1. User sends message via InputBar
2. API establishes SSE connection
3. Streaming response parsed and displayed in real-time
4. Evidence cards link to code in editor

#### Code Editor
1. Monaco editor with language support
2. Gutter hints for AI suggestions
3. Context menu integration
4. State persistence to localStorage

#### Knowledge Graph
1. Fetch graph data from API
2. Transform to React Flow format
3. Render custom nodes (files, classes, functions)
4. Interactive navigation to code

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID | Yes |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | AWS Cognito App Client ID | Yes |
| `NEXT_PUBLIC_COGNITO_REGION` | AWS Region | Yes |
| `NEXT_PUBLIC_OAUTH_DOMAIN` | Cognito OAuth domain | For OAuth |
| `NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN` | OAuth redirect URL | For OAuth |
| `NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT` | OAuth sign out URL | For OAuth |

### AWS Cognito Setup

1. Create a User Pool in AWS Cognito
2. Configure app client with OAuth flows
3. Add OAuth providers (Google, GitHub)
4. Set redirect URLs for your environment
5. Copy credentials to `.env.local`

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build image
docker build -t astramentor-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://api.example.com \
  -e NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id \
  -e NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id \
  -e NEXT_PUBLIC_COGNITO_REGION=us-east-1 \
  astramentor-frontend
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☁️ Vercel Deployment

### Deploy to Vercel

1. **Connect repository to Vercel**
   - Import project from GitHub
   - Select the repository

2. **Configure environment variables**
   - Add all `NEXT_PUBLIC_*` variables in Vercel dashboard
   - Set production values

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Automatic Deployments

- **Production**: Deploys on push to `main` branch
- **Preview**: Deploys on pull requests
- **CI/CD**: GitHub Actions runs tests before deployment

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests (Playwright)

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui
```

## 🎨 Design System

### Brand Colors

- **Electric Purple**: `#6C63FF` - Primary brand color
- **Teal**: `#00D4AA` - Secondary accent color

### Typography

- **UI Font**: Inter
- **Code Font**: JetBrains Mono

### Themes

- Light mode (default)
- Dark mode
- System preference detection

## 📝 Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier rules
- Write meaningful component and function names
- Add JSDoc comments for complex logic

### Component Structure

```typescript
'use client'; // For client components

import { ... } from '...';

interface ComponentProps {
  // Props with JSDoc
}

/**
 * Component description
 * 
 * Requirements: X.Y
 */
export function Component({ ...props }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### State Management

- **UI State**: Zustand stores (theme, panels, etc.)
- **Server State**: TanStack Query (API data)
- **Form State**: React Hook Form + Zod validation

### API Integration

1. Define types in `openapi.json`
2. Generate TypeScript types: `npm run generate:api-types`
3. Create endpoint functions in `src/lib/api/endpoints.ts`
4. Create query hooks in `src/lib/query/hooks.ts`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [React Flow](https://reactflow.dev/) - Graph visualization
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

## 📞 Support

For support, email support@astramentor.com or open an issue in the repository.

---

Built with ❤️ by the AstraMentor Team
