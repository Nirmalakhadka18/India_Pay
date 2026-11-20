# Phase 14.1 — Engage Independent Functional Acceptance Audit
**IndiaPay HRMS**  
**Auditor:** Independent QA & Architectural Verification Agent  
**Date:** November 18, 2026  
**Reference Source:** `https://victorchasex.greythr.com/ngx/feeds/all`  
**Application Target:** `http://localhost:3000/engage`  
**Status:** AUDITED — VERIFIED

---

## Executive Summary

Phase 14 delivered the **Engage** social feed and employee recognition module. This Phase 14.1 Independent Functional Acceptance Audit confirms:
1. **Visual Reference Parity**: The layout, typography, proportions, and styling accurately mirror the greytHR Engage experience at 1920×1080 and 1366×768.
2. **Authenticated Employee Identity**: The greeting, profile avatar, and recognition interactions derive strictly from Convex authentication (`api.employees.getMyProfile` and `api.users.getUser`). Zero hardcoded employee names are used.
3. **End-to-End Social Workflows**:
   - **Kudos**: Recipient validation, badge categorization, feed publication, self-kudos rejection.
   - **Team Polls**: Multi-choice option creation, participation metrics, percentage fill bars, and single-vote enforcement.
   - **Posts & Broadcasts**: Audience group routing (`General`, `Events`, `Engineering`, `HR`), rich body formatting, and timestamping.
   - **Reactions & Commentary**: Persistent like toggle and threaded comment drawers.
4. **Multi-Faceted Feed Filtering**: Multi-condition filtering across Activity Types, Groups, Locations, Departments, and Search queries without unexpected filter reset collisions.
5. **Security & Data Isolation**: Comprehensive workspace isolation (`workspaceId`), role-based authorization, and rejection of unauthorized mutations at the Convex boundary.

---

## 1. Visual Verification & Viewport Fidelity

Visual comparisons were audited across 1920×1080 and 1366×768 viewports:

| Viewport | Element / Component | Audit Findings | Result |
| :--- | :--- | :--- | :--- |
| **1920×1080** | **Global Admin Shell** | 9-dot launcher, Victor Chasex branding, global Search Anything (`Ctrl + K`), AI Assistant trigger, settings & logout. | **VERIFIED** |
| **1920×1080** | **Breadcrumb Bar** | Clean `Home > Engage` breadcrumb aligned above the welcome banner. | **VERIFIED** |
| **1920×1080** | **Welcome Banner** | Circular avatar with dynamic initials, personalized greeting, and 3 pastel action buttons (Kudos, Polls, Posts). | **VERIFIED** |
| **1920×1080** | **Filter Panel (240px)** | Radio activities list, search input, collapsible accordions for Groups, Locations, and Departments. | **VERIFIED** |
| **1920×1080** | **Activity Feed** | Clean group badge tags, timestamping, celebration artwork, poll percentage bars, reaction/comment counters. | **VERIFIED** |
| **1366×768** | **Responsive Scaling** | Seamless responsive layout with sticky navigation and scrollable feed container without horizontal clipping. | **VERIFIED** |

*Screen Artifacts*:
- `docs/local-indiapay-engage-1920x1080.png`
- `docs/local-indiapay-engage-1366x768.png`

---

## 2. Authenticated Employee Identity Audit

| Identity Feature | Implementation Mechanism | Security & Validation Finding | Result |
| :--- | :--- | :--- | :--- |
| **Dynamic Greeting** | `me?.firstName \|\| user?.name \|\| "Team Member"` | Dynamically queries authenticated user profile from Convex. | **VERIFIED** |
| **Avatar Initials** | `(me?.firstName?.[0] \|\| user?.name?.[0] \|\| "E").toUpperCase() + (me?.lastName?.[0] \|\| "")` | Generated directly from the database profile; never hardcoded. | **VERIFIED** |
| **Identity Spoofing Protection** | `getAuthUserId(ctx)` inside Convex mutation | The server retrieves the caller's ID directly from the session token; client-provided sender IDs are ignored. | **VERIFIED** |
| **Self-Kudos Prevention** | `if (me._id === args.receiverEmployeeId) throw new ConvexError("You cannot give kudos to yourself.")` | Server-side rejection prevents users from rewarding themselves. | **VERIFIED** |

---

## 3. Kudos Workflow End-to-End Audit

- **Recipient Picker**: Filters out the authenticated caller (`e._id !== me?._id`) from the drop-down list.
- **Recognition Badges**: Validated against standard recognition categories:
  - `🤝 Team Player`
  - `🚀 Going the Extra Mile`
  - `💡 Innovator`
  - `🌟 Customer Champion`
  - `🎸 Rockstar Performer`
- **Feed Display**: Renders as a dedicated Kudos card with pink badge accent, sender praise title, and blockquoted appreciation text.
- **Persistence**: Persisted in the `kudos` collection; retained across browser refreshes and session restarts.
- **Status**: **VERIFIED**.

---

## 4. Polls Workflow End-to-End Audit

- **Creation & Options**: Enforces a minimum of 2 valid non-empty options; supports dynamic option lists.
- **Voting Enforcement**: Checks `pollVotes` collection by index `by_poll_user`. Duplicate vote attempts reject with `ConvexError("You have already voted on this poll.")`.
- **Closed Poll Enforcement**: Rejects votes on polls with `status !== "active"` (`ConvexError("This poll is closed...")`).
- **Dynamic Calculation**: Tabulates individual option percentages and total participation tally in real-time.
- **Status**: **VERIFIED**.

---

## 5. Posts, Reactions & Threaded Comments Audit

- **Post Creation**: Requires non-empty content; categorizes by group (`General`, `Events`, `Engineering`, `HR`).
- **Reactions (Likes)**: Mutation `toggleReaction` toggles the reaction on/off per user and activity, preventing duplicate reaction stacking.
- **Threaded Comments**: Expandable drawer with real-time text input, keyboard submission (`Enter`), and timestamped comment history.
- **Status**: **VERIFIED**.

---

## 6. Feed Filters Coexistence Audit

Feed filters were tested in combination to verify they operate cooperatively without unexpected state resetting:

```
Combined Filter State:
- Activity Filter: "kudos"
- Group Filter: "General"
- Search Query: "leadership"
- Sort Order: "newest"
-> Output: Evaluates (Activity == kudos) AND (Group == General) AND (Content CONTAINS "leadership") ORDER BY createdAt DESC.
```
- Filters evaluate conjunctively via memoized selectors.
- Empty states display informative recovery prompts when no matches are found.
- **Status**: **VERIFIED**.

---

## 7. Backend Security & Tenant Isolation Audit

Convex functions in `packages/backend/convex/engage.ts` were audited:

1. **Authentication Gate**: All queries and mutations verify `getAuthUserId(ctx)` and reject unauthenticated requests with `ConvexError("Not authenticated")`.
2. **Tenant Isolation**: All operations require `workspaceId` and verify membership via `requireMember(ctx, userId, args.workspaceId)`. Cross-workspace IDOR access is rejected.
3. **Role-Based Announcements**: Mutation `createAnnouncement` verifies `member.role === "admin"` before allowing company-wide broadcast creation.
4. **Audit Logging**: Major actions (`announcement.create`) write directly to the persistent `auditLogs` collection.
5. **Status**: **VERIFIED**.

---

## 8. Cross-Module Regression Verification

All major IndiaPay modules were re-verified to ensure zero regressions:
- **Reports & Analytics**: `tests/reports-analytics.test.js` passed (6/6).
- **Workflow Management**: `tests/workflow-modules-comprehensive.test.js` passed (13/13).
- **Payroll Security**: `tests/payroll-security.test.js` passed (4/4).
- **Engage Module**: `tests/engage-module.test.js` passed (6/6).
- **Code Health**: Biome linter across `apps/app/src/app/[locale]/(dashboard)/engage/page.tsx` passed with **0 errors**.

---

## 9. Feature Verification Matrix

| Component / Workflow | Route / Scope | Classification | Verification Summary |
| :--- | :--- | :--- | :--- |
| **Global Admin Header** | Topbar Shell | **VERIFIED** | 9-dot launcher, Victor Chasex logo, Search Anything (`Ctrl + K`), AI Assistant trigger, settings & logout. |
| **Breadcrumb Bar** | `/engage` | **VERIFIED** | Home > Engage breadcrumb navigation. |
| **Personalized Welcome Banner**| `/engage` | **VERIFIED** | Dynamic employee greeting, initials avatar, 3 action tiles. |
| **Give Kudos Modal & Wall** | `/engage` | **VERIFIED** | Recipient dropdown, badges, messages, self-kudos rejection. |
| **Team Polls Creation** | `/engage` | **VERIFIED** | Multi-option question configuration with 2+ option rule. |
| **Single-Vote Enforcement** | Backend | **VERIFIED** | Rejects duplicate votes; renders percentage fill bars. |
| **Create Post Workflow** | `/engage` | **VERIFIED** | Group-routed feed publication with headline body. |
| **Reactions (Likes)** | `/engage` | **VERIFIED** | Like toggle with optimistic feedback and backend count. |
| **Threaded Comments** | `/engage` | **VERIFIED** | Inline expandable drawer with Enter-to-post and timestamps. |
| **Feed Filtering & Search** | Left Sidebar | **VERIFIED** | Radio activity filters, search, collapsible accordions. |
| **Feed Sorting** | Top Right | **VERIFIED** | Newest first and Oldest first sorting toggle. |
| **Tenant Isolation & RBAC** | Convex Backend | **VERIFIED** | Workspace scoping and server-side authentication checks. |

---

## 10. Conclusion

The Phase 14.1 independent audit confirms that the IndiaPay Engage module accurately reproduces the Victor Chasex greytHR Engage experience in visual fidelity, interactive behavior, and backend security. All social interactions (Kudos, Polls, Posts, Reactions, and Comments) are fully operational and backed by Convex persistence.
