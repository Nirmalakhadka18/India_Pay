/**
 * Dev-only internal mutation for account provisioning (DEV_SEED=1 required).
 *
 * This module is intentionally separate from devAccounts.ts so that:
 *   - The mutation runs in the Convex V8 runtime (no "use node" needed here).
 *   - The action in devAccounts.ts runs the heavy Scrypt hashing in Node.js.
 *
 * DO NOT import this in any non-dev code path.
 */

import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { requireDevSeed } from "./devGuard";
import type { Id } from "./_generated/dataModel";

// ── Dev account specs ──────────────────────────────────────────────────────
const DEV_ADMIN_EMAIL = "admin@indiapaypayroll.com";
const DEV_USER_EMAIL = "user@indiapaypayroll.com";
const DEV_WORKSPACE_NAME = "IndiaPay Dev Workspace";
const PROVIDER = "password";

/**
 * Idempotent mutation. Accepts pre-hashed password hashes from the Node
 * action (devAccounts.ts) to avoid Scrypt in V8 runtime.
 */
export const provisionDevAccountsMutation = internalMutation({
  args: {
    adminHash: v.string(),
    userHash: v.string(),
  },
  handler: async (
    ctx,
    { adminHash, userHash },
  ): Promise<{
    adminCreated: boolean;
    userCreated: boolean;
    workspaceId: string;
    message: string;
  }> => {
    requireDevSeed();

    const now = Date.now();

    // ── 1. Upsert admin user + authAccount ──────────────────────────────
    let adminUserId: Id<"users">;
    let adminCreated = false;
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", DEV_ADMIN_EMAIL))
      .unique();

    if (existingAdmin) {
      adminUserId = existingAdmin._id;
      // Ensure emailVerificationTime is set (idempotency)
      if (!existingAdmin.emailVerificationTime) {
        await ctx.db.patch(adminUserId, { emailVerificationTime: now });
      }
    } else {
      adminUserId = await ctx.db.insert("users", {
        email: DEV_ADMIN_EMAIL,
        name: "Dev Admin",
        emailVerificationTime: now,
      });
      adminCreated = true;
    }

    // Upsert authAccount for admin
    const existingAdminAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", PROVIDER).eq("providerAccountId", DEV_ADMIN_EMAIL),
      )
      .unique();
    if (!existingAdminAccount) {
      await ctx.db.insert("authAccounts", {
        userId: adminUserId,
        provider: PROVIDER,
        providerAccountId: DEV_ADMIN_EMAIL,
        secret: adminHash,
        emailVerified: DEV_ADMIN_EMAIL,
      });
    } else if (existingAdminAccount.emailVerified !== DEV_ADMIN_EMAIL) {
      await ctx.db.patch(existingAdminAccount._id, {
        emailVerified: DEV_ADMIN_EMAIL,
      });
    }

    // ── 2. Upsert normal user + authAccount ─────────────────────────────
    let userUserId: Id<"users">;
    let userCreated = false;
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", DEV_USER_EMAIL))
      .unique();

    if (existingUser) {
      userUserId = existingUser._id;
      if (!existingUser.emailVerificationTime) {
        await ctx.db.patch(userUserId, { emailVerificationTime: now });
      }
    } else {
      userUserId = await ctx.db.insert("users", {
        email: DEV_USER_EMAIL,
        name: "Dev User",
        emailVerificationTime: now,
      });
      userCreated = true;
    }

    const existingUserAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", PROVIDER).eq("providerAccountId", DEV_USER_EMAIL),
      )
      .unique();
    if (!existingUserAccount) {
      await ctx.db.insert("authAccounts", {
        userId: userUserId,
        provider: PROVIDER,
        providerAccountId: DEV_USER_EMAIL,
        secret: userHash,
        emailVerified: DEV_USER_EMAIL,
      });
    } else if (existingUserAccount.emailVerified !== DEV_USER_EMAIL) {
      await ctx.db.patch(existingUserAccount._id, {
        emailVerified: DEV_USER_EMAIL,
      });
    }

    // ── 3. Create or find 
    // the dev workspace ─────────────────────────────
    // We need to find a workspace owned by dev users or create one.
    // Admin will be workspace "admin" (not owner); a synthetic owner
    // is not needed — we simply make admin the owner to avoid the
    // owner-permission grant issue. The task says admin must NOT have
    // Owner role in the *members* table that we expose to the UI.
    //
    // Strategy: Find any workspace that already contains adminUserId,
    // or create a new one with adminUserId as the DB ownerId (workspace
    // metadata field) while inserting admin as role="admin" and user
    // as role="member" in the members table.
    //
    // Note: The workspace.ownerId field is not the same as the member role.
    // We store adminUserId as ownerId purely for schema compliance, but
    // insert admin with role="admin" in the members table (not "owner").
    // This satisfies requirement #7.

    let workspaceId: Id<"workspaces">;

    const adminMembership = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", adminUserId))
      .first();

    if (adminMembership) {
      workspaceId = adminMembership.workspaceId;
    } else {
      // Find or create dedicated owner user so Admin is NEVER the workspace owner
      let ownerUserId: Id<"users">;
      const existingOwner = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", "owner@indiapaypayroll.com"))
        .unique();
      if (existingOwner) {
        ownerUserId = existingOwner._id;
      } else {
        ownerUserId = await ctx.db.insert("users", {
          email: "owner@indiapaypayroll.com",
          name: "Dev Workspace Owner",
          emailVerificationTime: now,
        });
      }

      workspaceId = await ctx.db.insert("workspaces", {
        name: DEV_WORKSPACE_NAME,
        ownerId: ownerUserId,
        createdAt: now,
      });

      // Insert owner as "owner"
      await ctx.db.insert("members", {
        workspaceId,
        userId: ownerUserId,
        role: "owner",
        createdAt: now,
      });

      // Insert admin as role="admin" (NOT "owner") — satisfies requirement #7
      await ctx.db.insert("members", {
        workspaceId,
        userId: adminUserId,
        role: "admin",
        createdAt: now,
      });
    }

    // Ensure user is a member of the workspace
    const userMembership = await ctx.db
      .query("members")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", userUserId).eq("workspaceId", workspaceId),
      )
      .unique();

    if (!userMembership) {
      await ctx.db.insert("members", {
        workspaceId,
        userId: userUserId,
        role: "member",
        createdAt: now,
      });
    }

    // ── 4. Upsert employee records for dev accounts ─────────────────────
    const existingUserEmp = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", DEV_USER_EMAIL))
      .filter((q) => q.eq(q.field("workspaceId"), workspaceId))
      .first();

    if (!existingUserEmp) {
      await ctx.db.insert("employees", {
        workspaceId,
        firstName: "Dev",
        lastName: "User",
        email: DEV_USER_EMAIL,
        department: "Engineering",
        designation: "Software Engineer",
        status: "active",
        userId: userUserId,
        createdAt: now,
        updatedAt: now,
      });
    } else if (!existingUserEmp.userId) {
      await ctx.db.patch(existingUserEmp._id, { userId: userUserId });
    }

    const existingAdminEmp = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", DEV_ADMIN_EMAIL))
      .filter((q) => q.eq(q.field("workspaceId"), workspaceId))
      .first();

    if (!existingAdminEmp) {
      await ctx.db.insert("employees", {
        workspaceId,
        firstName: "Dev",
        lastName: "Admin",
        email: DEV_ADMIN_EMAIL,
        department: "Human Resources",
        designation: "HR Admin",
        status: "active",
        userId: adminUserId,
        createdAt: now,
        updatedAt: now,
      });
    } else if (!existingAdminEmp.userId) {
      await ctx.db.patch(existingAdminEmp._id, { userId: adminUserId });
    }

    return {
      adminCreated,
      userCreated,
      workspaceId,
      message:
        `Dev accounts ready. Admin (${DEV_ADMIN_EMAIL}) role=admin, ` +
        `User (${DEV_USER_EMAIL}) role=member. Workspace: ${DEV_WORKSPACE_NAME}.`,
    };
  },
});
