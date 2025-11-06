import type { User } from "../drizzle/schema";

/**
 * Development user voor testing zonder OAuth
 * Alleen actief wanneer NODE_ENV === 'development'
 */
export const DEV_USER: User = {
  id: 1,
  openId: "dev-user-123",
  name: "Development User",
  email: "dev@workday-portal.local",
  loginMethod: "dev",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export function shouldUseDevUser(): boolean {
  // Use dev user if:
  // 1. Explicitly in development mode, OR
  // 2. OAuth is not configured (no OAUTH_CLIENT_ID)
  const isDevMode = process.env.NODE_ENV === 'development';
  const oauthNotConfigured = !process.env.OAUTH_CLIENT_ID || process.env.OAUTH_CLIENT_ID === 'dev-client';
  const notExplicitlyDisabled = process.env.USE_DEV_AUTH !== 'false';
  
  return (isDevMode || oauthNotConfigured) && notExplicitlyDisabled;
}
