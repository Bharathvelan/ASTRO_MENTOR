/**
 * Shared types and interfaces for AstraMentor Enhanced Features
 * 
 * This file contains all type definitions for:
 * - Learning Progress Tracker
 * - Code Playground
 * - Smart Code Challenges
 * - AI Code Reviewer
 * - Code Snippet Library
 */

// ============================================================================
// Learning Progress Tracker Types
// ============================================================================

export interface UserProgress {
  userId: string;
  totalTimeSpent: number; // in minutes
  completedTopics: string[];
  inProgressTopics: string[];
  achievements: Achievement[];
  lastUpdated: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completedAt: Date;
  category: string;
}

export interface SkillTreeNode {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  prerequisites: string[];
  children: SkillTreeNode[];
  masteryLevel: number; // 0-100
}

export interface TimeEntry {
  id: string;
  userId: string;
  concept: string;
  duration: number; // in minutes
  timestamp: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: Date;
  category: string;
  badgeUrl?: string;
}

export interface LearningActivity {
  type: 'challenge' | 'playground' | 'review' | 'snippet';
  id: string;
  duration: number; // in minutes
  completed: boolean;
  score?: number;
}

export interface MasteryUpdate {
  language: string;
  previousLevel: number;
  newLevel: number;
  reason: string;
}

export interface ProgressReport {
  userId: string;
  timeRange: 'week' | 'month' | 'all';
  totalTimeSpent: number;
  activitiesCompleted: LearningActivity[];
  masteryLevels: Map<string, number>;
  achievements: Achievement[];
  generatedAt: Date;
}

// ============================================================================
// Code Playground Types
// ============================================================================

export type SupportedLanguage = 'javascript' | 'python' | 'typescript';

export interface ExecutionRequest {
  code: string;
  language: SupportedLanguage;
  timeout: number; // milliseconds
  memoryLimit: number; // MB
}

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number; // milliseconds
  memoryUsed: number; // MB
}

export interface PlaygroundSession {
  sessionId: string;
  userId: string;
  code: string;
  language: SupportedLanguage;
  lastSaved: Date;
  autoSaveEnabled: boolean;
}

export interface ShareMetadata {
  title?: string;
  description?: string;
  isPublic: boolean;
}

export interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
}

export interface SharedCode {
  id: string;
  code: string;
  language: SupportedLanguage;
  author: string;
  createdAt: Date;
  forkCount: number;
  viewCount: number;
  title?: string;
  description?: string;
}

// ============================================================================
// Smart Code Challenges Types
// ============================================================================

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  language: SupportedLanguage;
  topic: string;
  starterCode: string;
  testCases: TestCase[];
  hints: string[];
}

export interface TestCase {
  id: string;
  input: any;
  expectedOutput: any;
  isHidden: boolean;
  description: string;
}

export interface ValidationResult {
  passed: boolean;
  testResults: TestResult[];
  feedback: string;
  executionTime: number;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: any;
  expectedOutput: any;
  error?: string;
}

export interface PerformanceMetrics {
  successRate: number;
  averageTime: number;
  challengesCompleted: number;
  currentStreak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  challengesCompleted: number;
  averageTime: number;
}

// ============================================================================
// AI Code Reviewer Types
// ============================================================================

export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueCategory = 'quality' | 'security' | 'performance' | 'style';
export type ImpactLevel = 'high' | 'medium' | 'low';

export interface ReviewResult {
  overallScore: number; // 0-100
  issues: CodeIssue[];
  suggestions: Suggestion[];
  metrics: CodeMetrics;
  analyzedAt: Date;
}

export interface CodeIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  line: number;
  column: number;
  suggestion?: string;
}

export interface Suggestion {
  id: string;
  description: string;
  before: string;
  after: string;
  impact: ImpactLevel;
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  linesOfCode: number;
}

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: IssueCategory;
  message: string;
  line: number;
  column: number;
  suggestion?: string;
  cveId?: string;
  remediation: string;
}

export interface Optimization {
  description: string;
  estimatedImprovement: string;
  codeLocation: CodeLocation;
  example: string;
}

export interface CodeSmell {
  type: string;
  description: string;
  location: CodeLocation;
  refactoringApproach: string;
}

export interface CodeLocation {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

// ============================================================================
// Code Snippet Library Types
// ============================================================================

export interface Snippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: SupportedLanguage;
  tags: string[];
  category: string;
  isPublic: boolean;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface CreateSnippetRequest {
  title: string;
  description: string;
  code: string;
  language: SupportedLanguage;
  tags: string[];
  category: string;
  isPublic: boolean;
}

export interface SnippetFilters {
  language?: SupportedLanguage;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export type ErrorType = 
  | 'timeout' 
  | 'runtime_error' 
  | 'memory_limit' 
  | 'syntax_error'
  | 'network_error'
  | 'auth_error'
  | 'validation_error'
  | 'not_found'
  | 'conflict';

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: AppError;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
