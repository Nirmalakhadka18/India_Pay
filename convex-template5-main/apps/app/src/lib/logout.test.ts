import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  cleanClientSessionStorage,
  isLogoutInProgress,
  performLogout,
  resetLogoutFlag,
  setupBfcacheLogoutProtection,
} from "./logout";

describe("IndiaPay Logout & Session Cleanup", () => {
  let mockStorage: Record<string, string> = {};
  let mockSessionStorage: Record<string, string> = {};

  beforeEach(() => {
    resetLogoutFlag();
    mockStorage = {
      ws: "ws_test_123",
      __convexAuthJWT: "jwt_token_abc",
      __convexAuthRefreshToken: "refresh_token_xyz",
      otherKey: "keep_this",
    };
    mockSessionStorage = {
      __convexAuth_temp: "temp_token",
      otherSession: "session_val",
    };

    // Polyfill window, localStorage, and sessionStorage for Bun/Node test environment
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
        key: (i: number) => Object.keys(mockStorage)[i] ?? null,
        get length() {
          return Object.keys(mockStorage).length;
        },
      },
      sessionStorage: {
        getItem: (k: string) => mockSessionStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockSessionStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockSessionStorage[k];
        },
        key: (i: number) => Object.keys(mockSessionStorage)[i] ?? null,
        get length() {
          return Object.keys(mockSessionStorage).length;
        },
      },
      location: {
        replace: vi.fn(),
        reload: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  test("cleanClientSessionStorage removes all auth tokens and workspace state", () => {
    expect(window.localStorage.getItem("ws")).toBe("ws_test_123");
    expect(window.localStorage.getItem("__convexAuthJWT")).toBe(
      "jwt_token_abc",
    );

    cleanClientSessionStorage();

    expect(window.localStorage.getItem("ws")).toBeNull();
    expect(window.localStorage.getItem("__convexAuthJWT")).toBeNull();
    expect(window.localStorage.getItem("__convexAuthRefreshToken")).toBeNull();
    expect(window.sessionStorage.getItem("__convexAuth_temp")).toBeNull();
    // Non-auth keys are preserved
    expect(window.localStorage.getItem("otherKey")).toBe("keep_this");
    expect(window.sessionStorage.getItem("otherSession")).toBe("session_val");
  });

  test("performLogout executes clean sign out and navigates to /login", async () => {
    let signOutCalled = false;
    let navigatedTo: string | null = null;

    const mockSignOut = async () => {
      signOutCalled = true;
    };

    const result = await performLogout({
      signOut: mockSignOut,
      timeoutMs: 1000,
      redirectTo: "/login",
      navigate: (url) => {
        navigatedTo = url;
      },
    });

    expect(signOutCalled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.timedOut).toBe(false);
    expect(result.error).toBeNull();
    expect(navigatedTo).toBe("/login");
    expect(window.localStorage.getItem("ws")).toBeNull();
    expect(isLogoutInProgress()).toBe(false);
  });

  test("performLogout handles delayed/hanging sign-out without getting stuck", async () => {
    let timeoutCallbackFired = false;
    let navigatedTo: string | null = null;

    // Simulate hanging promise (never resolves)
    const hangingSignOut = () => new Promise<void>(() => {});

    const result = await performLogout({
      signOut: hangingSignOut,
      timeoutMs: 50, // Short timeout for testing
      redirectTo: "/login",
      onTimeout: () => {
        timeoutCallbackFired = true;
      },
      navigate: (url) => {
        navigatedTo = url;
      },
    });

    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(timeoutCallbackFired).toBe(true);
    expect(navigatedTo).toBe("/login");
    // Client state is still reliably cleared
    expect(window.localStorage.getItem("ws")).toBeNull();
    expect(window.localStorage.getItem("__convexAuthJWT")).toBeNull();
    expect(isLogoutInProgress()).toBe(false);
  });

  test("performLogout handles failed sign-out gracefully and cleans up", async () => {
    let errorCallbackFired = false;
    let caughtErr: unknown = null;
    let navigatedTo: string | null = null;

    const failingSignOut = async () => {
      throw new Error("Network connection lost");
    };

    const result = await performLogout({
      signOut: failingSignOut,
      timeoutMs: 1000,
      redirectTo: "/login",
      onError: (err) => {
        errorCallbackFired = true;
        caughtErr = err;
      },
      navigate: (url) => {
        navigatedTo = url;
      },
    });

    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(false);
    expect(errorCallbackFired).toBe(true);
    expect((caughtErr as Error).message).toBe("Network connection lost");
    expect(navigatedTo).toBe("/login");
    expect(window.localStorage.getItem("ws")).toBeNull();
  });

  test("performLogout prevents repeated concurrent logout executions", async () => {
    let executionCount = 0;
    const slowSignOut = async () => {
      executionCount++;
      await new Promise((r) => setTimeout(r, 100));
    };

    const p1 = performLogout({ signOut: slowSignOut, timeoutMs: 500 });
    const p2 = performLogout({ signOut: slowSignOut, timeoutMs: 500 });

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(executionCount).toBe(1);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(false);
    expect((r2.error as Error).message).toBe("Logout already in progress");
  });

  test("setupBfcacheLogoutProtection triggers reload on persisted pageshow event", () => {
    let registeredHandler: ((e: PageTransitionEvent) => void) | null = null;
    let reloadTriggered = false;

    const mockAddListener = (
      event: string,
      handler: EventListenerOrEventListenerObject,
    ) => {
      if (event === "pageshow") {
        registeredHandler = handler as (e: PageTransitionEvent) => void;
      }
    };

    (
      window as unknown as { addEventListener: typeof mockAddListener }
    ).addEventListener = mockAddListener;

    const cleanup = setupBfcacheLogoutProtection(() => {
      reloadTriggered = true;
    });

    expect(registeredHandler).not.toBeNull();

    // Normal non-persisted page load: does not reload
    registeredHandler!({ persisted: false } as PageTransitionEvent);
    expect(reloadTriggered).toBe(false);

    // Bfcache restoration (back button): triggers reload to force middleware check
    registeredHandler!({ persisted: true } as PageTransitionEvent);
    expect(reloadTriggered).toBe(true);

    cleanup();
  });
});
