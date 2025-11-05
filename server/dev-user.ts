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
  return process.env.NODE_ENV === 'development' && process.env.USE_DEV_AUTH !== 'false';
}
