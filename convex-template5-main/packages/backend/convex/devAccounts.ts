/**
 * Dev-only account provisioning (DEV_SEED=1 required).
 *
 * Provisions two test accounts:
 *   admin@indiapaypayroll.com  → role: admin  (not owner)
 *   user@indiapaypayroll.com   → role: member
 *
 * Passwords are hashed with Scrypt (the same algorithm used by the
 * production Password provider). Plain-text passwords are NEVER stored
 * in the database or logged.
 *
 * Enable:   convex env set DEV_SEED 1
 * Run:      npx convex run devAccounts:provisionDevAccounts --no-push
 *
 * This module runs in the Convex Node.js runtime ("use node") so that
 * the Lucia Scrypt implementation is available.
 */

"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireDevSeed } from "./devGuard";
import { Scrypt } from "lucia";

// ── Dev account emails (non-sensitive — emails are not secrets) ────────────
const DEV_ADMIN_EMAIL = "admin@indiapaypayroll.com";
const DEV_USER_EMAIL = "user@indiapaypayroll.com";

/**
 * Read passwords from env vars so they are never hardcoded in source.
 *
 * Set before running:
 *   $env:DEV_ADMIN_PASSWORD = "AdminTest@2026!"
 *   $env:DEV_USER_PASSWORD  = "UserTest@2026!"
 *
 * Or set them in packages/backend/.env.local (git-ignored).
 */
function readPasswords(): { adminPassword: string; userPassword: string } {
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;
  const userPassword = process.env.DEV_USER_PASSWORD;

  if (!adminPassword || !userPassword) {
    throw new Error(
      "DEV_ADMIN_PASSWORD and DEV_USER_PASSWORD must be set as environment " +
        "variables before running provisionDevAccounts. " +
        "Set them in packages/backend/.env.local or export them in your shell. " +
        "They are never stored in source code.",
    );
  }
  return { adminPassword, userPassword };
}

/**
 * Validate password meets the app's policy (8+, upper, lower, digit).
 * Mirrors the validatePasswordRequirements check in auth.ts.
 */
function validatePassword(label: string, password: string): void {
  if (
    password.length < 8 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      `${label} does not meet password requirements: ` +
        "must be at least 8 characters and include upper, lower, and a number.",
    );
  }
}

/**
 * Idempotent provisioner. Creates both test accounts and a shared dev
 * workspace if they don't already exist. Safe to re-run.
 */
export const provisionDevAccounts = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    adminCreated: boolean;
    userCreated: boolean;
    workspaceId: string;
    message: string;
  }> => {
    requireDevSeed();

    const { adminPassword, userPassword } = readPasswords();

    // Validate passwords meet the app's policy BEFORE hashing
    validatePassword("DEV_ADMIN_PASSWORD", adminPassword);
    validatePassword("DEV_USER_PASSWORD", userPassword);

    // Hash passwords using Scrypt — same algorithm as the Password provider
    const scrypt = new Scrypt();
    const [adminHash, userHash] = await Promise.all([
      scrypt.hash(adminPassword),
      scrypt.hash(userPassword),
    ]);

    // Delegate all DB writes to the V8 mutation (Scrypt not available there)
    const result = await ctx.runMutation(
      internal.devAccountsMutation.provisionDevAccountsMutation,
      { adminHash, userHash },
    );

    // Log completion status without exposing any credential values
    console.log(
      `[devAccounts] Provisioning complete. ` +
        `admin created=${result.adminCreated}, user created=${result.userCreated}`,
    );
    console.log(`[devAccounts] ${result.message}`);

    return result;
  },
});
