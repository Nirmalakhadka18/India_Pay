import { getAuthUserId } from "@convex-dev/auth/server";
import { asyncMap } from "convex-helpers";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { polar } from "./subscriptions";
import { username } from "./utils/validators";

export const getUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });
    return {
      ...user,
      name: user.username || user.name,
      subscription,
      avatarUrl: user.imageId
        ? await ctx.storage.getUrl(user.imageId)
        : undefined,
    };
  },
});

export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    const validatedUsername = username.safeParse(args.username);

    if (!validatedUsername.success) {
      throw new Error(validatedUsername.error.message);
    }
    await ctx.db.patch(userId, { username: validatedUsername.data });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateUserImage = mutation({
  args: {
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    ctx.db.patch(userId, { imageId: args.imageId });
  },
});

export const removeUserImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    ctx.db.patch(userId, { imageId: undefined, image: undefined });
  },
});

export const deleteUserAccount = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await asyncMap(
      ["google" /* add other providers as needed */],
      async (provider) => {
        const authAccount = await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) =>
            q.eq("userId", args.userId).eq("provider", provider),
          )
          .unique();
        if (!authAccount) {
          return;
        }
        await ctx.db.delete(authAccount._id);
      },
    );
    await ctx.db.delete(args.userId);
  },
});

export const deleteCurrentUserAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    const subscription = await polar.getCurrentSubscription(ctx, {
      userId,
    });
    if (!subscription) {
      console.error("No subscription found");
    } else {
      await polar.cancelSubscription(ctx, {
        revokeImmediately: true,
      });
    }
    await ctx.runMutation(internal.users.deleteUserAccount, {
      userId,
    });
  },
});

export const updateProfileInfo = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    timezone: v.optional(v.string()),
    biography: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Please sign in to update profile");
    }

    const updates: Record<string, string | undefined> = {};
    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (!trimmed) {
        throw new Error("Name cannot be empty");
      }
      updates.name = trimmed;
      updates.username = trimmed;
    }
    if (args.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new Error("Invalid email address format");
      }
      updates.email = args.email.trim();
    }
    if (args.timezone !== undefined) {
      updates.timezone = args.timezone.trim();
    }
    if (args.biography !== undefined) {
      updates.biography = args.biography.trim();
    }

    await ctx.db.patch(userId, updates);
    return { success: true };
  },
});

export const changeUserPassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
    confirmPassword: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Please sign in to change password");
    }

    if (args.newPassword !== args.confirmPassword) {
      throw new Error("New password and confirmation password do not match");
    }

    if (
      args.newPassword.length < 8 ||
      !/[a-z]/.test(args.newPassword) ||
      !/[A-Z]/.test(args.newPassword) ||
      !/\d/.test(args.newPassword)
    ) {
      throw new Error(
        "Password must be at least 8 characters and include upper, lower, and a number.",
      );
    }

    const user = await ctx.db.get(userId);
    const now = Date.now();

    await ctx.db.patch(userId, {
      lastPasswordChangedDate: now,
    });

    // Record security audit event in loginHistory
    await ctx.db.insert("loginHistory", {
      userId,
      userEmail: user?.email || "unknown@domain.com",
      userName: user?.name || user?.username,
      eventType: "password_changed",
      ipAddress: args.ipAddress || "127.0.0.1",
      timestamp: now,
    });

    return { success: true };
  },
});

export const recordLoginEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("login_success"),
      v.literal("login_failure"),
      v.literal("password_changed"),
    ),
    ipAddress: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, reason: "Unauthenticated" };
    }
    const user = await ctx.db.get(userId);
    if (!user) return { success: false, reason: "User not found" };

    const now = Date.now();
    await ctx.db.insert("loginHistory", {
      userId,
      userEmail: user.email || "user@domain.com",
      userName: user.name || user.username,
      eventType: args.eventType,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return { success: true };
  },
});

export const getLoginHistorySummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        lastLoginDate: null,
        lastLoginFailureDate: null,
        passwordChangedDate: null,
      };
    }

    const user = await ctx.db.get(userId);

    const lastSuccess = await ctx.db
      .query("loginHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("eventType"), "login_success"))
      .order("desc")
      .first();

    const lastFailure = await ctx.db
      .query("loginHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("eventType"), "login_failure"))
      .order("desc")
      .first();

    const lastPwChange = await ctx.db
      .query("loginHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("eventType"), "password_changed"))
      .order("desc")
      .first();

    return {
      lastLoginDate: lastSuccess ? lastSuccess.timestamp : null,
      lastLoginFailureDate: lastFailure ? lastFailure.timestamp : null,
      passwordChangedDate:
        lastPwChange?.timestamp || user?.lastPasswordChangedDate || null,
    };
  },
});

export const getLoginHistoryList = query({
  args: {
    searchTerm: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const records = await ctx.db
      .query("loginHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let filtered = records;

    if (args.startDate !== undefined) {
      filtered = filtered.filter((r) => r.timestamp >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      filtered = filtered.filter((r) => r.timestamp <= args.endDate!);
    }

    if (args.searchTerm?.trim()) {
      const term = args.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.userEmail.toLowerCase().includes(term) ||
          r.userName?.toLowerCase().includes(term) ||
          r.employeeNo?.toLowerCase().includes(term) ||
          r.ipAddress.includes(term),
      );
    }

    filtered.sort((a, b) => {
      if (args.sortOrder === "asc") {
        return a.timestamp - b.timestamp;
      }
      return b.timestamp - a.timestamp;
    });

    return filtered.map((r) => ({
      _id: r._id,
      date: new Date(r.timestamp).toISOString(),
      timestamp: r.timestamp,
      ipAddress: r.ipAddress,
      eventType: r.eventType,
      userEmail: r.userEmail,
      userName: r.userName,
    }));
  },
});
