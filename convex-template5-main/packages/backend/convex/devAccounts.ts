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
const DEV_OWNER_EMAIL = "owner@indiapaypayroll.com";
const DEV_ADMIN_EMAIL = "admin@indiapaypayroll.com";
const DEV_USER_EMAIL = "user@indiapaypayroll.com";

/**
 * Read passwords from env vars so they are never hardcoded in source.
 *
 * Supported variables:
 *   $env:DEV_OWNER_PASSWORD = "<OwnerPassword>"
 *   $env:DEV_ADMIN_PASSWORD = "<AdminPassword>"
 *   $env:DEV_USER_PASSWORD  = "<UserPassword>"
 *
 * Or set them in packages/backend/.env.local (git-ignored).
 */
function readPasswords(): {
  ownerPassword?: string;
  adminPassword?: string;
  userPassword?: string;
} {
  const ownerPassword = process.env.DEV_OWNER_PASSWORD;
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;
  const userPassword = process.env.DEV_USER_PASSWORD;

  if (!ownerPassword && !adminPassword && !userPassword) {
    throw new Error(
      "At least one of DEV_OWNER_PASSWORD, DEV_ADMIN_PASSWORD, or DEV_USER_PASSWORD " +
        "must be set as an environment variable before running provisionDevAccounts. " +
        "Set them in packages/backend/.env.local or export them in your shell. " +
        "They are never stored in source code.",
    );
  }
  return { ownerPassword, adminPassword, userPassword };
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
      `${label} does not meet password requirements: must be at least 8 characters and include upper, lower, and a number.`,
    );
  }
}

/**
 * Idempotent provisioner. Creates test accounts and a shared dev
 * workspace if they don't already exist. Safe to re-run.
 */
export const provisionDevAccounts = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    ownerCreated: boolean;
    adminCreated: boolean;
    userCreated: boolean;
    workspaceId: string;
    message: string;
  }> => {
    requireDevSeed();

    const { ownerPassword, adminPassword, userPassword } = readPasswords();

    const scrypt = new Scrypt();
    let ownerHash: string | undefined;
    let adminHash: string | undefined;
    let userHash: string | undefined;

    if (ownerPassword) {
      validatePassword("DEV_OWNER_PASSWORD", ownerPassword);
      ownerHash = await scrypt.hash(ownerPassword);
    }
    if (adminPassword) {
      validatePassword("DEV_ADMIN_PASSWORD", adminPassword);
      adminHash = await scrypt.hash(adminPassword);
    }
    if (userPassword) {
      validatePassword("DEV_USER_PASSWORD", userPassword);
      userHash = await scrypt.hash(userPassword);
    }

    // Delegate all DB writes to the V8 mutation (Scrypt not available there)
    const result = await ctx.runMutation(
      internal.devAccountsMutation.provisionDevAccountsMutation,
      { ownerHash, adminHash, userHash },
    );

    // Log completion status without exposing any credential values
    console.log(
      `[devAccounts] Provisioning complete. owner created=${result.ownerCreated}, admin created=${result.adminCreated}, user created=${result.userCreated}`,
    );
    console.log(`[devAccounts] ${result.message}`);

    return result;
  },
});
