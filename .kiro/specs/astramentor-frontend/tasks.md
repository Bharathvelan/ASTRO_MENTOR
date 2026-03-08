# Implementation Plan: AstraMentor Frontend

## Overview

This implementation plan breaks down the AstraMentor frontend into 21 sequential phases, following the build order specified in the requirements. Each phase builds upon previous work, ensuring incremental progress with testable milestones. The plan prioritizes core infrastructure first, then feature components, and finally testing and deployment.

## Tasks

- [x] 1. Project Scaffold: Next.js 14 + TypeScript + Tailwind + shadcn/ui
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and App Router
    - Run `npx create-next-app@latest` with TypeScript, Tailwind, App Router, src/ directory
    - Configure `tsconfig.json` with strict mode and path aliases (@/ for src/)
    - Set up `.env.local` with placeholder environment variables
    - _Requirements: 13.1, 13.8_
  
  - [x] 1.2 Install and configure core dependencies
    - Install: zustand, @tanstack/react-query, axios, zod, clsx, tailwind-merge
    - Install: @aws-amplify/auth, @aws-amplify/core (v6)
    - Install dev dependencies: @types/node, eslint, prettier
    - Configure ESLint and Prettier with consistent rules
    - _Requirements: 13.1, 14.1, 14.2_
  
  - [x] 1.3 Initialize shadcn/ui component library
    - Run `npx shadcn-ui@latest init` with default configuration
    - Install initial components: button, input, card, dialog, dropdown-menu, toast
    - Verify components render correctly in a test page
    - _Requirements: 1.1, 12.1_


- [ ] 2. Design Tokens: tailwind.config.ts + globals.css
  - [x] 2.1 Configure Tailwind with brand colors and design tokens
    - Add brand colors to `tailwind.config.ts`: electric-purple (#6C63FF), teal (#00D4AA)
    - Configure typography with JetBrains Mono font for code
    - Set up responsive breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
    - Add custom spacing scale for panel layouts
    - _Requirements: 12.6, 3.8_
  
  - [x] 2.2 Create global CSS variables and theme system
    - Define CSS custom properties in `globals.css` for light/dark themes
    - Set up color variables: --background, --foreground, --primary, --secondary, --accent
    - Configure semantic color tokens: --success, --warning, --error, --info
    - Add smooth transitions for theme switching
    - _Requirements: 11.3, 17.5_
  
  - [x] 2.3 Set up responsive typography system
    - Configure fluid font sizes using clamp() for body, headings, code
    - Set line heights and letter spacing for readability
    - Add font-family declarations: Inter for UI, JetBrains Mono for code
    - _Requirements: 19.4_

- [ ] 3. Auth: Amplify config + Cognito + login/register/callback pages
  - [x] 3.1 Configure AWS Amplify with Cognito
    - Create `src/lib/auth/amplify-config.ts` with Cognito pool configuration
    - Set up Amplify in root layout with `Amplify.configure()`
    - Configure OAuth redirect URLs for development and production
    - _Requirements: 1.1, 1.4_
  
  - [x] 3.2 Create authentication utilities and types
    - Define `AuthTokens`, `User`, `AuthState` interfaces in `src/types/auth.ts`
    - Create `src/lib/auth/auth-utils.ts` with token storage helpers
    - Implement secure token storage (httpOnly cookies fallback to localStorage)
    - _Requirements: 1.2, 16.1_
  
  - [x] 3.3 Build Zustand auth store
    - Create `src/lib/stores/auth-store.ts` with AuthState interface
    - Implement login, logout, refreshToken, loginWithOAuth actions
    - Add token persistence to localStorage with encryption
    - Implement automatic token refresh on expiry
    - _Requirements: 1.2, 1.5, 1.6, 14.1, 14.6_
  
  - [x] 3.4 Create login page with email/password form
    - Build `src/app/(auth)/login/page.tsx` with LoginForm component
    - Create `src/components/auth/LoginForm.tsx` with Zod validation
    - Add email and password fields with error states
    - Implement form submission with loading and error handling
    - _Requirements: 1.1, 1.2, 1.3, 13.6, 16.4_
  
  - [x] 3.5 Create registration page
    - Build `src/app/(auth)/register/page.tsx` with RegisterForm component
    - Create `src/components/auth/RegisterForm.tsx` with validation
    - Add fields: email, password, confirm password, name
    - Implement password strength indicator
    - _Requirements: 1.1, 16.4_
  
  - [x] 3.6 Add OAuth provider buttons
    - Create `src/components/auth/OAuthButtons.tsx` with Google and GitHub buttons
    - Implement OAuth flow initiation with Amplify
    - Add loading states during OAuth redirect
    - _Requirements: 1.4_
  
  - [x] 3.7 Create OAuth callback handler
    - Build `src/app/(auth)/callback/page.tsx` to handle OAuth redirects
    - Parse OAuth tokens from URL parameters
    - Store tokens and redirect to dashboard
    - Handle OAuth errors with user-friendly messages
    - _Requirements: 1.4_


- [x] 4. Middleware: route protection
  - [x] 4.1 Create Next.js middleware for route protection
    - Build `src/middleware.ts` with authentication check
    - Protect routes under `/dashboard/*` and `/workspace/*`
    - Redirect unauthenticated users to `/login` with return URL
    - Allow public routes: `/`, `/login`, `/register`, `/callback`
    - _Requirements: 1.6, 16.5, 16.6_
  
  - [x] 4.2 Create AuthGuard component for client-side protection
    - Build `src/components/auth/AuthGuard.tsx` HOC
    - Check authentication state from Zustand store
    - Show loading spinner while checking auth
    - Redirect to login if not authenticated
    - _Requirements: 1.6, 16.6_
  
  - [x] 4.3 Implement session restoration on page load
    - Add logic to restore session from stored tokens on app initialization
    - Validate token expiry and refresh if needed
    - Handle invalid/expired tokens by clearing state
    - _Requirements: 1.5, 14.7_

- [ ] 5. API Client: Axios + type generation from openapi.json
  - [x] 5.1 Set up Axios client with base configuration
    - Create `src/lib/api/client.ts` with Axios instance
    - Configure base URL from environment variable (NEXT_PUBLIC_API_URL)
    - Set default timeout: 30 seconds for standard requests
    - Add request/response logging in development mode
    - _Requirements: 13.1, 13.7_
  
  - [x] 5.2 Add authentication interceptor
    - Create request interceptor to add Authorization header with JWT token
    - Get token from auth store on each request
    - Skip auth header for public endpoints
    - _Requirements: 13.2_
  
  - [x] 5.3 Add error handling interceptor
    - Create response interceptor for error handling
    - Handle 401: attempt token refresh, retry request once, logout if refresh fails
    - Handle 4xx: extract and display error message from response
    - Handle 5xx: display generic error message, log details to console
    - _Requirements: 13.3, 13.4, 13.5, 13.6, 18.1_
  
  - [x] 5.4 Generate TypeScript types from OpenAPI spec
    - Add `openapi-typescript` to dev dependencies
    - Create script to generate types: `npm run generate:api-types`
    - Place generated types in `src/types/api.generated.ts`
    - Add type-safe API method wrappers in `src/lib/api/endpoints.ts`
    - _Requirements: 13.8_
  
  - [x] 5.5 Create API endpoint functions
    - Build typed functions for each endpoint: askQuestion, uploadRepo, getRepoStatus, etc.
    - Use generated types for request/response typing
    - Export all functions from `src/lib/api/index.ts`
    - _Requirements: 2.1, 4.1, 6.1, 7.1, 8.3_


- [ ] 6. Zustand stores + TanStack Query setup
  - [x] 6.1 Create UI state store
    - Build `src/lib/stores/ui-store.ts` for UI state
    - Add state: theme (light/dark), panelSizes, panelVisibility, commandPaletteOpen
    - Implement actions: toggleTheme, setPanelSize, togglePanel, openCommandPalette
    - Persist state to localStorage with middleware
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 11.3, 14.1, 14.6_
  
  - [x] 6.2 Create editor state store
    - Build `src/lib/stores/editor-store.ts` for Monaco editor state
    - Add state: content, language, cursorPosition, selection, isDirty, hints
    - Implement actions: setContent, updateCursor, addHint, clearHints
    - Persist editor content to localStorage with debouncing (500ms)
    - _Requirements: 3.6, 3.7, 14.1, 14.6_
  
  - [x] 6.3 Create chat state store
    - Build `src/lib/stores/chat-store.ts` for chat messages
    - Add state: messages, isStreaming, currentStream
    - Implement actions: addMessage, sendMessage, stopStream
    - Handle SSE connection lifecycle
    - _Requirements: 4.1, 4.2, 4.7, 14.1_
  
  - [x] 6.4 Set up TanStack Query provider
    - Create `src/lib/query/query-client.ts` with QueryClient configuration
    - Configure default options: staleTime, cacheTime, retry logic
    - Add QueryClientProvider to root layout
    - Set up devtools for development
    - _Requirements: 14.2, 14.3_
  
  - [x] 6.5 Create query hooks for API endpoints
    - Build `src/lib/query/hooks.ts` with custom hooks
    - Create hooks: useRepositories, useRepoStatus, useSessions, useGraphData
    - Configure stale times: sessions (5min), repos (1hr), graph (10min)
    - Implement optimistic updates for mutations
    - _Requirements: 2.2, 6.1, 8.4, 14.3, 14.4, 14.5_

- [ ] 7. Layout: Sidebar + TopBar + CommandPalette
  - [x] 7.1 Create root layout with providers
    - Update `src/app/layout.tsx` with QueryClientProvider, Toaster
    - Add theme provider for light/dark mode
    - Include global styles and fonts
    - _Requirements: 11.3_
  
  - [x] 7.2 Build TopBar component
    - Create `src/components/layout/TopBar.tsx`
    - Add repository selector dropdown (shows current repo, allows switching)
    - Add session controls: new session, session history dropdown
    - Add user menu: settings, logout
    - Make responsive: collapse to hamburger menu on mobile
    - _Requirements: 2.6, 8.4, 9.7, 19.2_
  
  - [x] 7.3 Build Sidebar component
    - Create `src/components/layout/Sidebar.tsx`
    - Add file tree view (placeholder for now, will populate later)
    - Add session history list with timestamps and previews
    - Make collapsible with toggle button
    - Persist collapsed state to UI store
    - _Requirements: 8.6, 9.1, 9.3_
  
  - [x] 7.4 Build CommandPalette component
    - Create `src/components/layout/CommandPalette.tsx` using shadcn/ui Dialog
    - Add keyboard shortcut listener: Cmd+K / Ctrl+K to open
    - Implement fuzzy search for commands
    - Add commands: new session, open file, toggle panel, change theme, verify code, settings
    - Display keyboard shortcuts next to commands
    - Support arrow key navigation and Enter to execute
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 17.1, 17.8_
  
  - [x] 7.5 Create dashboard layout wrapper
    - Build `src/app/(dashboard)/layout.tsx` with AuthGuard
    - Include TopBar, Sidebar, and main content area
    - Add CommandPalette as global component
    - _Requirements: 9.7, 16.6_


- [ ] 8. SSE hook + streaming infrastructure
  - [x] 8.1 Create SSE hook for streaming responses
    - Build `src/lib/hooks/useSSE.ts` custom hook
    - Accept URL and callbacks: onMessage, onError, onComplete
    - Create EventSource connection with proper cleanup
    - Parse JSON chunks from SSE stream
    - Handle connection errors with exponential backoff (1s, 2s, 4s, 8s, max 30s)
    - _Requirements: 4.2, 4.6, 18.3_
  
  - [x] 8.2 Add SSE reconnection logic
    - Implement automatic reconnection on disconnect
    - Track reconnection attempts (max 5)
    - Show reconnection indicator in UI
    - Provide manual reconnect button after max attempts
    - _Requirements: 4.6, 18.3, 18.4_
  
  - [x] 8.3 Create streaming message parser
    - Build `src/lib/utils/stream-parser.ts`
    - Parse SSE event types: delta, evidence, complete, error
    - Validate message structure with Zod schemas
    - Handle malformed messages gracefully
    - _Requirements: 4.2, 13.8, 18.8_
  
  - [x] 8.4 Add SSE timeout handling
    - Configure 5-minute timeout for SSE connections
    - Close connection and show error if timeout exceeded
    - Allow user to retry or cancel
    - _Requirements: 13.7_

- [ ] 9. Chat panel: all components + streaming integration
  - [x] 9.1 Create ChatPanel container component
    - Build `src/components/chat/ChatPanel.tsx`
    - Set up layout: message list + input bar
    - Connect to chat store for messages and streaming state
    - Add loading indicator when streaming
    - _Requirements: 4.1, 4.7_
  
  - [x] 9.2 Build MessageList with virtualization
    - Create `src/components/chat/MessageList.tsx`
    - Use react-window or @tanstack/react-virtual for virtualization
    - Render only visible messages for performance
    - Auto-scroll to bottom on new messages
    - _Requirements: 4.2, 15.3_
  
  - [x] 9.3 Build MessageBubble component
    - Create `src/components/chat/MessageBubble.tsx`
    - Display user vs assistant messages with different styles
    - Show agent avatar and type (Tutor, Architect, Debugger, Optimizer)
    - Render markdown content with syntax highlighting
    - _Requirements: 4.3, 4.8_
  
  - [x] 9.4 Build EvidenceCard component
    - Create `src/components/chat/EvidenceCard.tsx`
    - Display file path, line numbers, code snippet
    - Add click handler to navigate editor to referenced location
    - Show explanation text below snippet
    - _Requirements: 4.4, 4.5_
  
  - [x] 9.5 Build InputBar component
    - Create `src/components/chat/InputBar.tsx`
    - Add textarea with auto-resize (max 5 lines)
    - Add send button with loading state
    - Support Enter to send, Shift+Enter for new line
    - Disable input while streaming
    - _Requirements: 4.1, 4.7_
  
  - [x] 9.6 Build SuggestedQuestions component
    - Create `src/components/chat/SuggestedQuestions.tsx`
    - Display clickable question chips after response completes
    - Populate input bar on click
    - _Requirements: 4.7_
  
  - [x] 9.7 Integrate SSE streaming with chat
    - Connect useSSE hook to chat store
    - Handle delta events: append to current message
    - Handle evidence events: add to message evidence array
    - Handle complete events: mark message as complete, show suggested questions
    - Handle error events: display error message
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_
  
  - [x] 9.8 Add Socratic mode UI
    - Create `src/components/chat/SocraticHint.tsx`
    - Display "Show next hint" button when in Socratic mode
    - Track hint progression (1/3, 2/3, 3/3)
    - Show "Show solution" button after all hints
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 9.9 Implement skill level adaptation
    - Read skill level from user preferences
    - Pass skill level to API requests
    - Adjust hint detail based on skill level
    - _Requirements: 5.6, 5.7_


- [ ] 10. Monaco editor: CodeEditor + toolbar + gutter hints
  - [x] 10.1 Set up Monaco Editor with dynamic import
    - Install @monaco-editor/react
    - Create `src/components/editor/CodeEditor.tsx` with lazy loading
    - Configure editor options: theme, font (JetBrains Mono), fontSize (14px)
    - Add loading placeholder while Monaco loads
    - _Requirements: 3.1, 3.8, 15.4_
  
  - [x] 10.2 Configure language support
    - Add language definitions for: JavaScript, TypeScript, Python, Java, Go, Rust
    - Load language support on-demand based on file extension
    - Configure syntax highlighting themes for light/dark mode
    - _Requirements: 3.1, 15.4_
  
  - [x] 10.3 Implement autocomplete and IntelliSense
    - Enable built-in Monaco autocomplete
    - Configure language-specific suggestions
    - _Requirements: 3.2_
  
  - [x] 10.4 Add gutter hint decorations
    - Create `src/components/editor/GutterHint.tsx`
    - Use Monaco decorations API to add gutter icons
    - Support hint types: info (blue), warning (yellow), error (red)
    - Connect to editor store hints array
    - _Requirements: 3.3, 3.4_
  
  - [x] 10.5 Build hint popover
    - Create `src/components/editor/HintPopover.tsx`
    - Show popover on gutter hint click
    - Display AI explanation with markdown rendering
    - Add "Ask follow-up" button to open chat with context
    - _Requirements: 3.4_
  
  - [x] 10.6 Add context menu integration
    - Extend Monaco context menu with custom actions
    - Add "Ask about selection" option
    - Send selected code to chat with context
    - _Requirements: 3.5_
  
  - [x] 10.7 Implement editor state persistence
    - Save content to editor store on change (debounced 500ms)
    - Save cursor position and scroll position
    - Restore state on component mount
    - _Requirements: 3.6, 14.6, 14.7_
  
  - [x] 10.8 Build EditorToolbar component
    - Create `src/components/editor/EditorToolbar.tsx`
    - Add file tabs for open files
    - Add actions: save, format, verify code
    - Add font size selector (12-20px)
    - Make responsive: hide labels on mobile, show icons only
    - _Requirements: 3.7, 3.8, 19.6_
  
  - [x] 10.9 Implement file opening from sidebar
    - Connect sidebar file tree clicks to editor
    - Load file content via API
    - Update editor language based on file extension
    - Add file to open tabs
    - _Requirements: 3.7_

- [ ] 11. Workspace page: three-panel layout + wiring chat ↔ editor
  - [x] 11.1 Create Workspace page component
    - Build `src/app/(dashboard)/workspace/page.tsx`
    - Set up 3-panel layout: Sidebar | Editor | Chat
    - Use react-resizable-panels for resizable dividers
    - _Requirements: 9.1_
  
  - [x] 11.2 Implement panel resizing
    - Add draggable dividers between panels
    - Set minimum widths: sidebar (200px), editor (400px), chat (300px)
    - Persist panel sizes to UI store on resize
    - Restore sizes on page load
    - _Requirements: 9.2, 9.5_
  
  - [x] 11.3 Implement panel collapse/expand
    - Add collapse buttons to panel headers
    - Redistribute space when panel collapses
    - Restore previous width when expanding
    - Persist visibility state to UI store
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [x] 11.4 Add responsive layout for mobile
    - Detect viewport width < 1024px
    - Switch to tabbed interface: Editor | Chat | Files
    - Add tab navigation at top
    - Persist active tab to UI store
    - _Requirements: 9.6, 19.3_
  
  - [x] 11.5 Wire chat evidence cards to editor navigation
    - Connect EvidenceCard click handler to editor
    - Use Monaco API to navigate to line number
    - Highlight referenced code range
    - Scroll to make code visible
    - _Requirements: 4.5_
  
  - [ ] 11.6 Wire editor selection to chat context
    - Capture selected code from Monaco
    - Add "Ask about selection" to context menu
    - Pre-fill chat input with selected code context
    - _Requirements: 3.5_


- [x] 12. Knowledge Graph page: React Flow + interactions
  - [x] 12.1 Set up React Flow
    - Install reactflow package
    - Create `src/app/(dashboard)/graph/page.tsx`
    - Set up ReactFlow component with basic configuration
    - Add background and controls (zoom, pan, fit view)
    - _Requirements: 6.1, 6.7_
  
  - [x] 12.2 Create custom node components
    - Build `src/components/graph/FileNode.tsx` for file entities (blue)
    - Build `src/components/graph/ClassNode.tsx` for class entities (purple)
    - Build `src/components/graph/FunctionNode.tsx` for function entities (teal)
    - Style nodes with consistent design system
    - _Requirements: 6.3_
  
  - [x] 12.3 Create custom edge components
    - Build `src/components/graph/RelationshipEdge.tsx`
    - Style edges by type: imports (solid), calls (dashed), extends (thick), implements (dotted)
    - Add edge labels for relationship types
    - _Requirements: 6.4_
  
  - [x] 12.4 Fetch and render graph data
    - Use useGraphData query hook to fetch data
    - Transform API response to React Flow format (nodes, edges)
    - Render nodes and edges in ReactFlow
    - Show loading state while fetching
    - _Requirements: 6.1, 6.2_
  
  - [x] 12.5 Implement node click handler
    - Create `src/components/graph/NodeDetailPanel.tsx`
    - Show panel on node click with entity information
    - Display metrics: lines of code, complexity, dependencies
    - Add "Open in editor" button
    - _Requirements: 6.5_
  
  - [x] 12.6 Implement node double-click navigation
    - Add double-click handler to nodes
    - Navigate to workspace page
    - Open file in Monaco editor at entity location
    - _Requirements: 6.6_
  
  - [x] 12.7 Add graph controls and optimization
    - Implement zoom, pan, fit-to-view controls
    - Add minimap for large graphs (>100 nodes)
    - Implement clustering for large graphs
    - Add search/filter for nodes
    - _Requirements: 6.7, 6.8_
  
  - [x] 12.8 Make graph responsive for mobile
    - Adapt controls for touch interaction
    - Simplify node rendering on small screens
    - Add pinch-to-zoom support
    - _Requirements: 19.7_

- [ ] 13. Verifier panel: all states
  - [x] 13.1 Create VerifierPanel container component
    - Build `src/components/verifier/VerifierPanel.tsx`
    - Set up layout: header with "Verify Code" button + results area
    - Connect to TanStack Query mutation for verification
    - _Requirements: 7.1_
  
  - [x] 13.2 Build loading state UI
    - Create `src/components/verifier/VerifierLoading.tsx`
    - Display spinner with "Running tests..." message
    - Show progress indicator if available from API
    - _Requirements: 7.2_
  
  - [x] 13.3 Build test results display
    - Create `src/components/verifier/TestResults.tsx`
    - Group results by test suite
    - Display pass/fail status with icons (✓ green, ✗ red)
    - Show test name and execution time
    - _Requirements: 7.3, 7.4_
  
  - [x] 13.4 Build failed test detail view
    - Create `src/components/verifier/FailedTest.tsx`
    - Display failure message and stack trace
    - Add click handler to navigate editor to relevant code
    - Syntax highlight stack traces
    - _Requirements: 7.5, 7.6_
  
  - [x] 13.5 Build summary statistics component
    - Create `src/components/verifier/TestSummary.tsx`
    - Display: total tests, passed, failed, skipped, coverage %
    - Show success message with green checkmark when all pass
    - _Requirements: 7.7, 7.8_
  
  - [x] 13.6 Integrate verifier with editor
    - Send current editor content to verify endpoint
    - Handle verification response and display results
    - Connect failed test clicks to editor navigation
    - _Requirements: 7.1, 7.6_


- [ ] 14. Repository upload + indexing progress
  - [x] 14.1 Create repository upload component
    - Build `src/components/repo/RepoUpload.tsx`
    - Add file input for repository archive (.zip, .tar.gz)
    - Add drag-and-drop zone for file upload
    - Validate file size and format before upload
    - _Requirements: 2.1_
  
  - [x] 14.2 Implement upload progress tracking
    - Use Axios onUploadProgress callback
    - Display progress bar with percentage
    - Show upload speed and estimated time remaining
    - Allow cancellation of upload
    - _Requirements: 2.1_
  
  - [x] 14.3 Create indexing progress component
    - Build `src/components/repo/IndexingProgress.tsx`
    - Poll GET /api/v1/repo/{repoId}/status every 2 seconds
    - Display progress bar with percentage
    - Show current file being indexed
    - _Requirements: 2.2, 2.3_
  
  - [x] 14.4 Handle indexing completion and errors
    - Show success message when indexing completes
    - Enable workspace and graph features
    - Display error message with details if indexing fails
    - Provide retry option on failure
    - _Requirements: 2.4, 2.5_
  
  - [x] 14.5 Build repository selector
    - Create `src/components/repo/RepoSelector.tsx` for TopBar
    - Fetch user repositories with useRepositories hook
    - Display dropdown with repo names
    - Show current active repository
    - Allow switching between repositories
    - _Requirements: 2.6_
  
  - [x] 14.6 Display repository metadata
    - Show file count, total size, last indexed timestamp
    - Display in repository selector tooltip or detail view
    - _Requirements: 2.7_

- [ ] 15. Dashboard home page
  - [x] 15.1 Create dashboard home page
    - Build `src/app/(dashboard)/page.tsx`
    - Set up grid layout for dashboard cards
    - Make responsive: 2 columns on desktop, 1 on mobile
    - _Requirements: 19.1, 19.2_
  
  - [x] 15.2 Build recent sessions card
    - Create `src/components/dashboard/RecentSessions.tsx`
    - Display list of recent sessions with timestamps
    - Show session title and last message preview
    - Add click handler to open session in workspace
    - _Requirements: 8.4, 8.6_
  
  - [x] 15.3 Build repositories card
    - Create `src/components/dashboard/RepositoriesCard.tsx`
    - Display list of repositories with status
    - Show indexing status, file count, last updated
    - Add "Upload new repository" button
    - _Requirements: 2.6, 2.7_
  
  - [x] 15.4 Build quick actions card
    - Create `src/components/dashboard/QuickActions.tsx`
    - Add buttons: New Session, Upload Repo, View Graph, Settings
    - Use icons with labels
    - _Requirements: 8.1_
  
  - [x] 15.5 Build activity feed card
    - Create `src/components/dashboard/ActivityFeed.tsx`
    - Display recent activity: sessions created, repos uploaded, tests run
    - Show timestamps and activity type icons
    - _Requirements: 8.3_


- [x] 16. Settings page
  - [x] 16.1 Create settings page layout
    - Build `src/app/(dashboard)/settings/page.tsx`
    - Set up tabbed interface: Profile, Learning, Editor, Appearance
    - Make responsive: vertical tabs on desktop, dropdown on mobile
    - _Requirements: 11.1, 19.2_
  
  - [x] 16.2 Build Profile settings tab
    - Create `src/components/settings/ProfileSettings.tsx`
    - Add fields: name, email (read-only), avatar upload
    - Add "Change password" button
    - Implement save with validation
    - _Requirements: 11.1, 11.6_
  
  - [x] 16.3 Build Learning settings tab
    - Create `src/components/settings/LearningSettings.tsx`
    - Add skill level selector: beginner, intermediate, advanced
    - Add Socratic mode toggle
    - Add hint detail preference slider
    - _Requirements: 11.2, 11.5_
  
  - [x] 16.4 Build Editor settings tab
    - Create `src/components/settings/EditorSettings.tsx`
    - Add font size selector (12-20px)
    - Add theme selector for editor (vs-dark, vs-light, high-contrast)
    - Add tab size selector (2, 4, 8 spaces)
    - Add word wrap toggle
    - _Requirements: 11.4_
  
  - [x] 16.5 Build Appearance settings tab
    - Create `src/components/settings/AppearanceSettings.tsx`
    - Add theme toggle: light, dark, system
    - Add color scheme selector (if multiple themes)
    - Apply theme immediately on change
    - _Requirements: 11.3_
  
  - [x] 16.6 Implement settings persistence
    - Save settings to backend on change
    - Use TanStack Query mutation for updates
    - Show save confirmation toast
    - Load settings on app initialization
    - _Requirements: 11.6, 11.7_

- [ ] 17. Landing page
  - [x] 17.1 Create landing page layout
    - Build `src/app/page.tsx` (public route)
    - Set up sections: hero, features, how-it-works, footer
    - Make fully responsive
    - _Requirements: 12.1, 12.7_
  
  - [x] 17.2 Build hero section
    - Create `src/components/landing/Hero.tsx`
    - Add headline: "Learn to Code with AI-Powered Socratic Tutoring"
    - Add subheadline describing value proposition
    - Add primary CTA button: "Get Started" → /register
    - Add secondary CTA: "Learn More" → scroll to features
    - Use brand colors: electric purple, teal
    - _Requirements: 12.1, 12.2, 12.6_
  
  - [x] 17.3 Build features section
    - Create `src/components/landing/Features.tsx`
    - Display 4 feature cards: AI Tutoring, Code Analysis, Knowledge Graph, Test Verification
    - Add icons and descriptions for each feature
    - Use grid layout: 2x2 on desktop, 1 column on mobile
    - _Requirements: 12.3, 19.2_
  
  - [x] 17.4 Build how-it-works section
    - Create `src/components/landing/HowItWorks.tsx`
    - Display 3-4 steps showing user journey
    - Add step numbers, titles, descriptions
    - Add illustrations or screenshots
    - _Requirements: 12.4_
  
  - [x] 17.5 Build footer
    - Create `src/components/landing/Footer.tsx`
    - Add links: Documentation, Privacy Policy, Terms of Service, Contact
    - Add social media icons
    - Add copyright notice
    - _Requirements: 12.5_
  
  - [x] 17.6 Optimize landing page for mobile
    - Ensure all sections stack properly on mobile
    - Optimize images for mobile (smaller sizes, WebP)
    - Test touch interactions
    - _Requirements: 12.7, 19.2_


- [ ] 18. Unit tests (Vitest)
  - [ ] 18.1 Set up Vitest testing infrastructure
    - Install vitest, @testing-library/react, @testing-library/jest-dom
    - Create `vitest.config.ts` with React and TypeScript support
    - Set up test utilities in `tests/utils/test-utils.tsx`
    - Configure coverage reporting (target: 80% for business logic)
    - _Requirements: 20.1, 20.4_
  
  - [ ]* 18.2 Write unit tests for authentication utilities
    - Test `src/lib/auth/auth-utils.ts` functions
    - Test token storage, retrieval, validation
    - Test token expiry checking
    - _Requirements: 1.2, 1.5, 1.6, 20.1_
  
  - [ ]* 18.3 Write unit tests for API client
    - Test Axios interceptors (auth, error handling)
    - Test request/response transformations
    - Mock API responses with MSW
    - Test error scenarios: 401, 4xx, 5xx
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6, 20.1, 20.7_
  
  - [ ]* 18.4 Write unit tests for Zustand stores
    - Test auth store: login, logout, token refresh
    - Test UI store: theme toggle, panel resize, panel visibility
    - Test editor store: content updates, cursor tracking, hints
    - Test chat store: message handling, streaming state
    - _Requirements: 14.1, 14.6, 20.1_
  
  - [ ]* 18.5 Write component tests for authentication
    - Test LoginForm: validation, submission, error display
    - Test RegisterForm: validation, password strength
    - Test OAuthButtons: OAuth flow initiation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 20.2_
  
  - [ ]* 18.6 Write component tests for chat components
    - Test MessageBubble: user vs assistant rendering, markdown
    - Test EvidenceCard: display and click handling
    - Test InputBar: input handling, send button state
    - Test SuggestedQuestions: click handling
    - _Requirements: 4.3, 4.4, 4.5, 4.7, 4.8, 20.2_
  
  - [ ]* 18.7 Write component tests for editor components
    - Test GutterHint: decoration rendering
    - Test HintPopover: display and interactions
    - Test EditorToolbar: actions and responsiveness
    - _Requirements: 3.3, 3.4, 3.8, 20.2_
  
  - [ ]* 18.8 Write component tests for graph components
    - Test FileNode, ClassNode, FunctionNode rendering
    - Test RelationshipEdge styling
    - Test NodeDetailPanel display
    - _Requirements: 6.3, 6.4, 6.5, 20.2_
  
  - [ ]* 18.9 Write component tests for verifier components
    - Test VerifierLoading state
    - Test TestResults display and grouping
    - Test FailedTest detail view
    - Test TestSummary statistics
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.7, 7.8, 20.2_
  
  - [ ]* 18.10 Write tests for SSE streaming
    - Test useSSE hook with simulated event streams
    - Test reconnection logic with exponential backoff
    - Test message parsing and error handling
    - Mock EventSource with MSW
    - _Requirements: 4.2, 4.6, 18.3, 20.8_
  
  - [ ]* 18.11 Write tests for utility functions
    - Test stream parser: delta, evidence, complete, error events
    - Test validation schemas with Zod
    - Test helper functions: formatters, validators
    - _Requirements: 13.8, 16.4, 18.8, 20.1_


- [ ] 19. E2E tests (Playwright)
  - [ ] 19.1 Set up Playwright testing infrastructure
    - Install @playwright/test
    - Create `playwright.config.ts` with browser configurations
    - Set up test fixtures in `tests/e2e/fixtures/`
    - Configure base URL and authentication state
    - _Requirements: 20.3_
  
  - [ ]* 19.2 Write E2E test for authentication flow
    - Test user registration: form validation, submission, redirect
    - Test user login: credentials, OAuth, session restoration
    - Test logout: token clearing, redirect
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 20.3_
  
  - [ ]* 19.3 Write E2E test for repository upload and indexing
    - Test file upload: drag-and-drop, progress tracking
    - Test indexing progress: polling, completion
    - Test error handling: upload failure, indexing failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 20.3_
  
  - [ ]* 19.4 Write E2E test for workspace interaction
    - Test panel resizing and collapsing
    - Test editor: typing, file opening, syntax highlighting
    - Test chat: sending message, receiving streaming response
    - Test evidence card click → editor navigation
    - _Requirements: 3.7, 4.1, 4.2, 4.5, 9.2, 9.3, 9.4, 20.3_
  
  - [ ]* 19.5 Write E2E test for knowledge graph
    - Test graph rendering: nodes, edges, controls
    - Test node click: detail panel display
    - Test node double-click: editor navigation
    - Test zoom, pan, fit-to-view
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 20.3_
  
  - [ ]* 19.6 Write E2E test for code verification
    - Test verify button click: loading state
    - Test results display: pass/fail, summary
    - Test failed test click: editor navigation
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.8, 20.3_
  
  - [ ]* 19.7 Write E2E test for session management
    - Test new session creation
    - Test session history display
    - Test session restoration: messages, editor state
    - Test session deletion
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.7, 20.3_
  
  - [ ]* 19.8 Write E2E test for settings
    - Test theme change: immediate application
    - Test skill level change: persistence
    - Test editor settings: font size, word wrap
    - _Requirements: 11.2, 11.3, 11.4, 11.6, 20.3_
  
  - [ ]* 19.9 Write E2E test for command palette
    - Test keyboard shortcut: Cmd+K / Ctrl+K
    - Test command search: fuzzy matching
    - Test command execution: new session, toggle panel
    - Test keyboard navigation: arrows, Enter, Escape
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.7, 20.3_
  
  - [ ]* 19.10 Write E2E test for responsive behavior
    - Test mobile layout: stacked panels, hamburger menu
    - Test tablet layout: panel resizing
    - Test desktop layout: full 3-panel workspace
    - _Requirements: 9.6, 19.2, 19.3, 20.3_


- [x] 20. Docker + Vercel config
  - [x] 20.1 Create Dockerfile for containerization
    - Build multi-stage Dockerfile with Node.js 20
    - Stage 1: Install dependencies and build Next.js app
    - Stage 2: Production image with only runtime dependencies
    - Configure environment variables for runtime
    - Optimize image size with .dockerignore
    - _Requirements: 15.1_
  
  - [x] 20.2 Create docker-compose.yml for local development
    - Set up service for frontend with hot reload
    - Configure volume mounts for src/ directory
    - Set up environment variables
    - Add health check for container
    - _Requirements: 15.1_
  
  - [x] 20.3 Configure Vercel deployment
    - Create `vercel.json` with build configuration
    - Set up environment variables in Vercel dashboard
    - Configure build command: `npm run build`
    - Configure output directory: `.next`
    - Set up preview deployments for PRs
    - _Requirements: 15.1_
  
  - [x] 20.4 Set up CI/CD pipeline
    - Create `.github/workflows/ci.yml` for GitHub Actions
    - Add jobs: lint, type-check, test, build
    - Run tests on every PR
    - Deploy to Vercel on merge to main
    - _Requirements: 20.5_
  
  - [x] 20.5 Configure environment variables
    - Document all required env vars in `.env.example`
    - Set up separate configs for: development, staging, production
    - Include: API URL, Cognito config, feature flags
    - _Requirements: 13.1, 16.8_
  
  - [x] 20.6 Implement security headers
    - Configure Content Security Policy in `next.config.js`
    - Add security headers: X-Frame-Options, X-Content-Type-Options
    - Configure CORS for API requests
    - _Requirements: 16.2, 16.8_
  
  - [x] 20.7 Set up error tracking
    - Integrate Sentry or similar error tracking service
    - Configure error boundaries to report to service
    - Add source maps for production debugging
    - _Requirements: 18.5_
  
  - [x] 20.8 Implement service worker for offline capability
    - Create service worker with Next.js PWA plugin
    - Cache static assets and API responses
    - Implement offline fallback page
    - _Requirements: 15.7_
  
  - [x] 20.9 Optimize performance
    - Implement code splitting for routes and heavy components
    - Add prefetching for critical routes
    - Optimize images with Next.js Image component
    - Implement lazy loading for Monaco and React Flow
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_


- [ ] 21. README + final polish
  - [x] 21.1 Write comprehensive README.md
    - Add project overview and features
    - Add prerequisites: Node.js 20+, npm/yarn
    - Add installation instructions: clone, install, configure env vars
    - Add development commands: dev, build, test, lint
    - Add deployment instructions for Docker and Vercel
    - Add architecture overview with diagram
    - Add contributing guidelines
    - _Requirements: All_
  
  - [x] 21.2 Create additional documentation
    - Create `docs/ARCHITECTURE.md` with detailed system design
    - Create `docs/API.md` with API integration guide
    - Create `docs/TESTING.md` with testing strategy and examples
    - Create `docs/DEPLOYMENT.md` with deployment guide
    - _Requirements: All_
  
  - [x] 21.3 Implement accessibility improvements
    - Audit with axe DevTools and fix issues
    - Ensure all interactive elements have ARIA labels
    - Test keyboard navigation across all pages
    - Test with screen reader (NVDA or VoiceOver)
    - Verify color contrast ratios meet WCAG AA
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_
  
  - [x] 21.4 Implement error boundaries
    - Create global error boundary in root layout
    - Create feature-specific error boundaries for: editor, chat, graph
    - Add fallback UI with error details and reset button
    - Log errors to error tracking service
    - _Requirements: 18.6, 18.7_
  
  - [x] 21.5 Add loading states and skeletons
    - Create skeleton components for: chat messages, editor, graph, dashboard cards
    - Add loading spinners for async operations
    - Implement optimistic UI updates where appropriate
    - _Requirements: 14.3, 15.8_
  
  - [x] 21.6 Implement input validation and sanitization
    - Add Zod schemas for all form inputs
    - Sanitize user-generated content before rendering
    - Validate API responses against schemas
    - _Requirements: 16.3, 16.4, 18.8_
  
  - [x] 21.7 Add toast notifications
    - Implement toast system with shadcn/ui Toast component
    - Add toasts for: success, error, info, warning
    - Use for: save confirmations, error messages, background operations
    - _Requirements: 18.1_
  
  - [x] 21.8 Implement focus management
    - Ensure focus returns to trigger element when closing modals
    - Add focus trap in modals and dialogs
    - Implement skip links for main content areas
    - _Requirements: 17.3, 17.4_
  
  - [ ] 21.9 Add visual regression tests
    - Install @playwright/test with screenshot comparison
    - Capture screenshots of key UI components
    - Set up baseline images
    - Run visual regression tests in CI
    - _Requirements: 20.6_
  
  - [ ] 21.10 Performance audit and optimization
    - Run Lighthouse audit on all pages
    - Optimize bundle size: analyze with webpack-bundle-analyzer
    - Implement route prefetching for instant navigation
    - Optimize initial page load to < 2s on 3G
    - Achieve Lighthouse score 90+ on desktop
    - _Requirements: 15.1, 15.2, 15.6, 15.8_
  
  - [ ] 21.11 Final QA and bug fixes
    - Test all user flows end-to-end
    - Test on multiple browsers: Chrome, Firefox, Safari, Edge
    - Test on multiple devices: desktop, tablet, mobile
    - Fix any remaining bugs or UI inconsistencies
    - _Requirements: All_

- [ ] 22. Checkpoint - Final review and deployment readiness
  - Ensure all tests pass (unit, integration, E2E)
  - Verify all requirements are met
  - Confirm documentation is complete
  - Review security checklist
  - Perform final performance audit
  - Ask the user if questions arise or if ready to deploy

## Notes

- Tasks marked with `*` are optional test-related sub-tasks that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The build order follows a logical progression: infrastructure → auth → API → state → layout → features → testing → deployment
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All components should be built with accessibility, responsiveness, and performance in mind from the start
- Testing tasks are distributed throughout to catch errors early rather than being deferred to the end
- The final phase includes comprehensive polish, documentation, and deployment preparation

