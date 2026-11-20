import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireMember } from "./orgs";

/**
 * List all workspaces the current authenticated user belongs to.
 * This query provides full tenant isolation by joining the user's `members`
 * and returning only the workspaces they are authorized to access.
 */
export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (memberships.length === 0) {
      return [];
    }

    const out = [];
    for (const m of memberships) {
      const ws = await ctx.db.get(m.workspaceId);
      if (ws) {
        out.push({
          _id: ws._id,
          _creationTime: ws._creationTime,
          name: ws.name,
          role: m.role,
        });
      }
    }

    return out;
  },
});

/**
 * Get details for a specific workspace with server-side authorization check.
 */
export const getWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    await requireMember(ctx, userId, args.workspaceId);
    return await ctx.db.get(args.workspaceId);
  },
});
