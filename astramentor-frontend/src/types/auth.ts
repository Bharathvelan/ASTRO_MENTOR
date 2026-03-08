/**
 * Authentication type definitions
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type OAuthProvider = 'google' | 'github';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  socraticMode: boolean;
  editorFontSize: number;
  editorTheme: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  skillLevel: SkillLevel;
  preferences: UserPreferences;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
}
