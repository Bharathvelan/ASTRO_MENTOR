# Requirements Document: AstraMentor Frontend

## Introduction

AstraMentor is an explainable multi-agent AI-powered learning and developer productivity platform. The frontend provides an integrated development environment with real-time AI assistance, Socratic learning capabilities, code knowledge graph visualization, and test verification. The system enables developers to learn through guided exploration while receiving context-aware assistance from multiple specialized AI agents.

## Glossary

- **AstraMentor_System**: The complete frontend application including all UI components, state management, and API integrations
- **Monaco_Editor**: The code editor component based on Monaco Editor library
- **SSE_Stream**: Server-Sent Events streaming connection for real-time AI responses
- **Chat_Panel**: The conversational interface for interacting with AI agents
- **Knowledge_Graph**: Visual representation of code relationships and dependencies using React Flow
- **Verifier_Panel**: Component displaying test execution results and code verification status
- **Auth_Module**: Authentication system using AWS Cognito via Amplify
- **Workspace**: The main 3-panel layout containing sidebar, editor, and chat
- **Session**: A persistent conversation context with associated code and history
- **Repository**: User-uploaded codebase that has been indexed for analysis
- **Skill_Level**: User's proficiency setting (beginner, intermediate, advanced) affecting hint progression
- **Evidence_Card**: UI component showing code references and explanations from AI responses
- **Command_Palette**: Keyboard-driven quick action interface
- **Socratic_Mode**: Learning mode that provides progressive hints rather than direct answers
- **Agent_Response**: Streamed message from backend AI agents
- **Gutter_Hint**: Inline code annotation displayed in Monaco editor margin

## Requirements

### Requirement 1: User Authentication

**User Story:** As a developer, I want to securely authenticate using email/password or OAuth providers, so that I can access my personalized learning environment and saved sessions.

#### Acceptance Criteria

1. WHEN a user visits the login page, THE Auth_Module SHALL display email/password fields and OAuth provider buttons
2. WHEN a user submits valid credentials, THE Auth_Module SHALL authenticate via AWS Cognito and redirect to the dashboard
3. WHEN a user submits invalid credentials, THE Auth_Module SHALL display a descriptive error message and maintain form state
4. WHEN a user clicks an OAuth provider button, THE Auth_Module SHALL initiate the OAuth flow and handle the callback
5. WHEN an authenticated user refreshes the page, THE Auth_Module SHALL restore the session using stored tokens
6. WHEN a user's session expires, THE Auth_Module SHALL redirect to login and preserve the intended destination
7. WHEN a user logs out, THE Auth_Module SHALL clear all tokens and redirect to the landing page

### Requirement 2: Repository Management

**User Story:** As a developer, I want to upload my codebase for analysis, so that I can receive context-aware assistance and visualize code relationships.

#### Acceptance Criteria

1. WHEN a user uploads a repository archive, THE AstraMentor_System SHALL send it to the backend via POST /api/v1/repo/upload
2. WHEN a repository upload completes, THE AstraMentor_System SHALL poll GET /api/v1/repo/{repoId}/status for indexing progress
3. WHEN indexing is in progress, THE AstraMentor_System SHALL display a progress indicator with percentage and current file
4. WHEN indexing completes successfully, THE AstraMentor_System SHALL enable the workspace and knowledge graph features
5. IF indexing fails, THEN THE AstraMentor_System SHALL display an error message with failure details
6. WHEN a user has multiple repositories, THE AstraMentor_System SHALL allow switching between them via a selector
7. WHEN displaying repository status, THE AstraMentor_System SHALL show file count, size, and last indexed timestamp

### Requirement 3: Code Editor Integration

**User Story:** As a developer, I want a powerful code editor with AI-powered hints, so that I can write and review code with intelligent assistance.

#### Acceptance Criteria

1. THE Monaco_Editor SHALL support syntax highlighting for JavaScript, TypeScript, Python, Java, Go, and Rust
2. WHEN a user types in the editor, THE Monaco_Editor SHALL provide autocomplete suggestions based on language semantics
3. WHEN AI analysis identifies relevant code locations, THE Monaco_Editor SHALL display gutter hints with icons
4. WHEN a user clicks a gutter hint, THE Monaco_Editor SHALL show a popover with the AI explanation
5. WHEN a user selects code, THE Monaco_Editor SHALL enable "Ask about selection" in the context menu
6. THE Monaco_Editor SHALL persist editor state (content, cursor position, scroll) across page refreshes
7. WHEN a user opens a file from the sidebar, THE Monaco_Editor SHALL load and display the file content
8. THE Monaco_Editor SHALL use JetBrains Mono font and support configurable font size (12-20px)

### Requirement 4: Real-Time AI Chat

**User Story:** As a developer, I want to ask questions and receive streaming responses from AI agents, so that I can learn and solve problems interactively.

#### Acceptance Criteria

1. WHEN a user submits a question, THE Chat_Panel SHALL send it via POST /api/v1/ask and establish an SSE_Stream
2. WHEN the SSE_Stream receives data, THE Chat_Panel SHALL parse and display Agent_Response chunks in real-time
3. WHEN multiple agents respond, THE Chat_Panel SHALL visually distinguish responses by agent type (Tutor, Architect, Debugger)
4. WHEN an Agent_Response includes code references, THE Chat_Panel SHALL render Evidence_Card components with file paths and line numbers
5. WHEN a user clicks an Evidence_Card, THE Monaco_Editor SHALL navigate to the referenced code location
6. IF the SSE_Stream connection fails, THEN THE Chat_Panel SHALL display a reconnection indicator and retry with exponential backoff
7. WHEN a response completes, THE Chat_Panel SHALL enable follow-up question input and display suggested questions
8. THE Chat_Panel SHALL support markdown rendering including code blocks with syntax highlighting

### Requirement 5: Socratic Learning Mode

**User Story:** As a learner, I want progressive hints instead of direct answers, so that I can develop problem-solving skills through guided discovery.

#### Acceptance Criteria

1. WHERE Socratic_Mode is enabled, THE Chat_Panel SHALL request hint-based responses from the backend
2. WHEN Socratic_Mode provides a hint, THE Chat_Panel SHALL display a "Show next hint" button instead of the full answer
3. WHEN a user requests the next hint, THE Chat_Panel SHALL reveal progressively more detailed guidance
4. WHEN a user has exhausted all hints, THE Chat_Panel SHALL offer to show the complete solution
5. WHILE Socratic_Mode is active, THE Chat_Panel SHALL track hint progression and display current hint level (1/3, 2/3, etc.)
6. WHEN a user's Skill_Level is set to beginner, THE Chat_Panel SHALL provide more detailed initial hints
7. WHEN a user's Skill_Level is set to advanced, THE Chat_Panel SHALL provide minimal initial hints

### Requirement 6: Knowledge Graph Visualization

**User Story:** As a developer, I want to visualize code relationships and dependencies, so that I can understand system architecture and navigate complex codebases.

#### Acceptance Criteria

1. WHEN a user opens the knowledge graph view, THE Knowledge_Graph SHALL fetch data via GET /api/v1/graph/{repoId}/summary
2. WHEN graph data is received, THE Knowledge_Graph SHALL render nodes for files, classes, and functions using React Flow
3. WHEN displaying nodes, THE Knowledge_Graph SHALL use different colors for different entity types (files: blue, classes: purple, functions: teal)
4. WHEN displaying edges, THE Knowledge_Graph SHALL show relationship types (imports, calls, extends, implements)
5. WHEN a user clicks a node, THE Knowledge_Graph SHALL display a detail panel with entity information and metrics
6. WHEN a user double-clicks a node, THE Monaco_Editor SHALL open the corresponding file at the entity location
7. THE Knowledge_Graph SHALL support zoom, pan, and fit-to-view controls
8. WHEN the graph has more than 100 nodes, THE Knowledge_Graph SHALL enable clustering and provide a minimap

### Requirement 7: Code Verification

**User Story:** As a developer, I want to verify my code changes with automated tests, so that I can ensure correctness before committing.

#### Acceptance Criteria

1. WHEN a user clicks "Verify Code", THE Verifier_Panel SHALL send the current editor content via POST /api/v1/verify
2. WHEN verification is in progress, THE Verifier_Panel SHALL display a loading indicator with "Running tests..." message
3. WHEN verification completes, THE Verifier_Panel SHALL display test results grouped by test suite
4. WHEN displaying test results, THE Verifier_Panel SHALL show pass/fail status, test name, and execution time
5. WHEN a test fails, THE Verifier_Panel SHALL display the failure message and stack trace
6. WHEN a user clicks a failed test, THE Monaco_Editor SHALL navigate to the relevant code location
7. THE Verifier_Panel SHALL display summary statistics (total tests, passed, failed, skipped, coverage percentage)
8. WHEN all tests pass, THE Verifier_Panel SHALL display a success message with green checkmark

### Requirement 8: Session Management

**User Story:** As a developer, I want to save and restore conversation sessions, so that I can continue learning across multiple work sessions.

#### Acceptance Criteria

1. WHEN a user starts a new conversation, THE AstraMentor_System SHALL create a new Session with a unique identifier
2. WHEN a user sends messages, THE AstraMentor_System SHALL associate them with the current Session
3. WHEN a user navigates away, THE AstraMentor_System SHALL persist the Session state to backend storage
4. WHEN a user returns, THE AstraMentor_System SHALL display a list of recent sessions with timestamps and preview text
5. WHEN a user selects a previous session, THE AstraMentor_System SHALL restore the conversation history and editor state
6. WHEN displaying session history, THE AstraMentor_System SHALL show session title, last message preview, and timestamp
7. WHEN a user deletes a session, THE AstraMentor_System SHALL remove it from the list and confirm the action

### Requirement 9: Workspace Layout

**User Story:** As a developer, I want a flexible workspace layout, so that I can organize my development environment according to my preferences.

#### Acceptance Criteria

1. THE Workspace SHALL display a 3-panel layout with resizable dividers (sidebar | editor | chat)
2. WHEN a user drags a panel divider, THE Workspace SHALL resize panels in real-time with minimum widths (sidebar: 200px, editor: 400px, chat: 300px)
3. WHEN a user collapses a panel, THE Workspace SHALL hide it and redistribute space to remaining panels
4. WHEN a user reopens a collapsed panel, THE Workspace SHALL restore its previous width
5. THE Workspace SHALL persist panel sizes and visibility state to localStorage
6. WHEN the viewport width is below 1024px, THE Workspace SHALL switch to a stacked layout with tab navigation
7. THE Workspace SHALL include a topbar with repository selector, session controls, and user menu

### Requirement 10: Command Palette

**User Story:** As a developer, I want keyboard-driven quick actions, so that I can navigate and execute commands efficiently without using the mouse.

#### Acceptance Criteria

1. WHEN a user presses Cmd+K (Mac) or Ctrl+K (Windows/Linux), THE Command_Palette SHALL open with focus on the search input
2. WHEN a user types in the search input, THE Command_Palette SHALL filter available commands by fuzzy matching
3. WHEN displaying commands, THE Command_Palette SHALL show command name, description, and keyboard shortcut
4. WHEN a user selects a command, THE Command_Palette SHALL execute it and close the palette
5. THE Command_Palette SHALL support navigation with arrow keys and selection with Enter
6. THE Command_Palette SHALL include commands for: new session, open file, toggle panel, change theme, verify code, open settings
7. WHEN a user presses Escape, THE Command_Palette SHALL close without executing any command

### Requirement 11: User Settings

**User Story:** As a developer, I want to customize my learning experience, so that I can optimize the interface for my skill level and preferences.

#### Acceptance Criteria

1. WHEN a user opens settings, THE AstraMentor_System SHALL display sections for: Profile, Learning, Editor, Appearance
2. WHEN a user changes Skill_Level, THE AstraMentor_System SHALL update the setting and apply it to future Socratic_Mode interactions
3. WHEN a user changes theme (light/dark), THE AstraMentor_System SHALL apply the theme immediately without page refresh
4. WHEN a user changes editor font size, THE Monaco_Editor SHALL update the font size in real-time
5. WHEN a user toggles Socratic_Mode, THE Chat_Panel SHALL enable or disable progressive hint behavior
6. WHEN a user saves settings, THE AstraMentor_System SHALL persist them to backend user preferences
7. THE AstraMentor_System SHALL load user settings on authentication and apply them to the interface

### Requirement 12: Landing Page

**User Story:** As a potential user, I want to understand AstraMentor's value proposition, so that I can decide whether to sign up.

#### Acceptance Criteria

1. THE AstraMentor_System SHALL display a hero section with headline, subheadline, and primary CTA button
2. WHEN a user clicks the primary CTA, THE AstraMentor_System SHALL navigate to the registration page
3. THE AstraMentor_System SHALL display a features section highlighting: AI Tutoring, Code Analysis, Knowledge Graph, Test Verification
4. THE AstraMentor_System SHALL display a how-it-works section with 3-4 steps showing the user journey
5. THE AstraMentor_System SHALL display a footer with links to: Documentation, Privacy Policy, Terms of Service, Contact
6. THE AstraMentor_System SHALL use the brand color palette (electric purple #6C63FF, teal #00D4AA)
7. WHEN the viewport width is below 768px, THE AstraMentor_System SHALL display a mobile-optimized layout with stacked sections

### Requirement 13: API Client Integration

**User Story:** As a developer, I want reliable API communication with proper error handling, so that the application gracefully handles network issues and backend errors.

#### Acceptance Criteria

1. THE AstraMentor_System SHALL use Axios for all HTTP requests with a base URL configured from environment variables
2. WHEN making authenticated requests, THE AstraMentor_System SHALL include the JWT token in the Authorization header
3. WHEN a request fails with 401 Unauthorized, THE AstraMentor_System SHALL attempt token refresh and retry the request once
4. IF token refresh fails, THEN THE AstraMentor_System SHALL clear authentication state and redirect to login
5. WHEN a request fails with 5xx errors, THE AstraMentor_System SHALL display a user-friendly error message and log details
6. WHEN a request fails with 4xx errors (except 401), THE AstraMentor_System SHALL display the error message from the response
7. THE AstraMentor_System SHALL implement request timeout of 30 seconds for standard requests and 5 minutes for SSE streams
8. THE AstraMentor_System SHALL generate TypeScript types from OpenAPI specification using openapi-typescript

### Requirement 14: State Management

**User Story:** As a developer, I want predictable state management, so that the application maintains consistency across components and handles async operations reliably.

#### Acceptance Criteria

1. THE AstraMentor_System SHALL use Zustand for client state (UI state, editor state, panel visibility)
2. THE AstraMentor_System SHALL use TanStack Query for server state (API data, caching, background refetching)
3. WHEN fetching data, THE AstraMentor_System SHALL display loading states and handle errors with retry logic
4. WHEN data is successfully fetched, THE AstraMentor_System SHALL cache it with appropriate stale time (sessions: 5min, repos: 1hr)
5. WHEN mutations succeed, THE AstraMentor_System SHALL invalidate related queries to trigger refetch
6. THE AstraMentor_System SHALL persist critical client state (auth tokens, panel sizes, theme) to localStorage
7. WHEN the application loads, THE AstraMentor_System SHALL hydrate state from localStorage before rendering

### Requirement 15: Performance Optimization

**User Story:** As a developer, I want a fast and responsive application, so that I can work efficiently without waiting for UI updates or page loads.

#### Acceptance Criteria

1. THE AstraMentor_System SHALL achieve Lighthouse performance score of 90+ on desktop
2. THE AstraMentor_System SHALL implement code splitting with dynamic imports for routes and heavy components
3. WHEN rendering large lists (session history, file tree), THE AstraMentor_System SHALL use virtualization to render only visible items
4. THE Monaco_Editor SHALL lazy load language support and only load syntax definitions for active file types
5. THE AstraMentor_System SHALL implement image optimization with Next.js Image component and WebP format
6. THE AstraMentor_System SHALL prefetch critical routes and data on hover for instant navigation
7. THE AstraMentor_System SHALL implement service worker for offline capability and faster subsequent loads
8. WHEN the initial page loads, THE AstraMentor_System SHALL display content within 2 seconds on 3G connection

### Requirement 16: Security

**User Story:** As a developer, I want my code and data protected, so that I can trust the platform with sensitive information.

#### Acceptance Criteria

1. THE Auth_Module SHALL store JWT tokens in httpOnly cookies when possible, falling back to secure localStorage
2. THE AstraMentor_System SHALL implement Content Security Policy (CSP) headers to prevent XSS attacks
3. THE AstraMentor_System SHALL sanitize all user-generated content before rendering to prevent injection attacks
4. THE AstraMentor_System SHALL validate all form inputs using Zod schemas before submission
5. THE AstraMentor_System SHALL implement route protection to prevent unauthorized access to authenticated pages
6. WHEN a user is not authenticated, THE AstraMentor_System SHALL redirect protected routes to login
7. THE AstraMentor_System SHALL implement CSRF protection for state-changing operations
8. THE AstraMentor_System SHALL use HTTPS for all API communication in production

### Requirement 17: Accessibility

**User Story:** As a developer with accessibility needs, I want keyboard navigation and screen reader support, so that I can use the platform effectively.

#### Acceptance Criteria

1. THE AstraMentor_System SHALL support full keyboard navigation with visible focus indicators
2. THE AstraMentor_System SHALL implement ARIA labels and roles for all interactive elements
3. THE AstraMentor_System SHALL maintain focus management when opening/closing modals and panels
4. THE AstraMentor_System SHALL provide skip links to jump to main content areas
5. THE AstraMentor_System SHALL ensure color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
6. THE AstraMentor_System SHALL support screen reader announcements for dynamic content updates
7. THE AstraMentor_System SHALL provide text alternatives for all non-text content
8. THE Command_Palette SHALL be fully operable via keyboard without mouse interaction

### Requirement 18: Error Handling and Resilience

**User Story:** As a developer, I want clear error messages and recovery options, so that I can understand and resolve issues quickly.

#### Acceptance Criteria

1. WHEN an error occurs, THE AstraMentor_System SHALL display a user-friendly error message with actionable guidance
2. WHEN a network request fails, THE AstraMentor_System SHALL provide a "Retry" button to attempt the operation again
3. WHEN the SSE_Stream disconnects, THE Chat_Panel SHALL automatically attempt reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
4. IF reconnection fails after 5 attempts, THEN THE Chat_Panel SHALL display a manual reconnect button
5. WHEN an unexpected error occurs, THE AstraMentor_System SHALL log error details to the console and error tracking service
6. THE AstraMentor_System SHALL implement error boundaries to prevent full application crashes
7. WHEN an error boundary catches an error, THE AstraMentor_System SHALL display a fallback UI with error details and reset option
8. THE AstraMentor_System SHALL validate API responses against expected schemas and handle malformed data gracefully

### Requirement 19: Responsive Design

**User Story:** As a developer using different devices, I want the interface to adapt to my screen size, so that I can work comfortably on any device.

#### Acceptance Criteria

1. THE AstraMentor_System SHALL support viewport widths from 320px (mobile) to 3840px (4K desktop)
2. WHEN viewport width is below 768px, THE AstraMentor_System SHALL display mobile navigation with hamburger menu
3. WHEN viewport width is below 1024px, THE Workspace SHALL switch from side-by-side panels to tabbed interface
4. THE AstraMentor_System SHALL use responsive typography with fluid font sizes (clamp(14px, 2vw, 16px) for body)
5. THE AstraMentor_System SHALL optimize touch targets for mobile (minimum 44x44px)
6. WHEN on mobile, THE Monaco_Editor SHALL display a simplified toolbar with essential actions only
7. THE Knowledge_Graph SHALL adapt controls for touch interaction on mobile devices

### Requirement 20: Testing Infrastructure

**User Story:** As a developer, I want comprehensive test coverage, so that I can confidently deploy changes without breaking existing functionality.

#### Acceptance Criteria

1. THE AstraMentor_System SHALL include unit tests for all utility functions and hooks using Vitest
2. THE AstraMentor_System SHALL include component tests for all UI components using React Testing Library
3. THE AstraMentor_System SHALL include end-to-end tests for critical user flows using Playwright
4. THE AstraMentor_System SHALL achieve minimum 80% code coverage for business logic
5. THE AstraMentor_System SHALL run tests in CI/CD pipeline before deployment
6. THE AstraMentor_System SHALL include visual regression tests for key UI components
7. THE AstraMentor_System SHALL mock API calls in tests using MSW (Mock Service Worker)
8. THE AstraMentor_System SHALL test SSE streaming behavior with simulated event streams
