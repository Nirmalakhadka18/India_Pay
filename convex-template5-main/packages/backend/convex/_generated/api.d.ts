/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as apiKeys from "../apiKeys.js";
import type * as attendance from "../attendance.js";
import type * as audit from "../audit.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as backend from "../backend.js";
import type * as compliance from "../compliance.js";
import type * as counters from "../counters.js";
import type * as dashboard from "../dashboard.js";
import type * as devAccounts from "../devAccounts.js";
import type * as devAccountsMutation from "../devAccountsMutation.js";
import type * as devGuard from "../devGuard.js";
import type * as email from "../email.js";
import type * as email_index from "../email/index.js";
import type * as email_templates_subscriptionEmail from "../email/templates/subscriptionEmail.js";
import type * as employees from "../employees.js";
import type * as env from "../env.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as jobs from "../jobs.js";
import type * as leaves from "../leaves.js";
import type * as lop from "../lop.js";
import type * as notifications from "../notifications.js";
import type * as orgs from "../orgs.js";
import type * as passwordProviders from "../passwordProviders.js";
import type * as payroll from "../payroll.js";
import type * as salaries from "../salaries.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as statutory from "../statutory.js";
import type * as subscriptions from "../subscriptions.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";
import type * as utils_validators from "../utils/validators.js";
import type * as web from "../web.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  apiKeys: typeof apiKeys;
  attendance: typeof attendance;
  audit: typeof audit;
  auditLog: typeof auditLog;
  auth: typeof auth;
  backend: typeof backend;
  compliance: typeof compliance;
  counters: typeof counters;
  dashboard: typeof dashboard;
  devAccounts: typeof devAccounts;
  devAccountsMutation: typeof devAccountsMutation;
  devGuard: typeof devGuard;
  email: typeof email;
  "email/index": typeof email_index;
  "email/templates/subscriptionEmail": typeof email_templates_subscriptionEmail;
  employees: typeof employees;
  env: typeof env;
  files: typeof files;
  http: typeof http;
  init: typeof init;
  jobs: typeof jobs;
  leaves: typeof leaves;
  lop: typeof lop;
  notifications: typeof notifications;
  orgs: typeof orgs;
  passwordProviders: typeof passwordProviders;
  payroll: typeof payroll;
  salaries: typeof salaries;
  seed: typeof seed;
  sessions: typeof sessions;
  statutory: typeof statutory;
  subscriptions: typeof subscriptions;
  usage: typeof usage;
  users: typeof users;
  "utils/validators": typeof utils_validators;
  web: typeof web;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  polar: import("@convex-dev/polar/_generated/component.js").ComponentApi<"polar">;
};
