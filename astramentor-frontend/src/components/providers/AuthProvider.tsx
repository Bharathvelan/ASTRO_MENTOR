'use client';

import { ReactNode } from 'react';
import { Amplify } from '@aws-amplify/core';
import { amplifyConfig } from '@/lib/auth/amplify-config';

// Initialize AWS Amplify with the configuration from environment variables
console.log('Amplify Init - UserPoolID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) {
  console.error(
    'CRITICAL: Amplify UserPool configuration is missing! Check your .env.local file.',
  );
}

Amplify.configure(amplifyConfig);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
