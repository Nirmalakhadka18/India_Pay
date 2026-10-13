import { beforeEach, describe, expect, test } from "vitest";
import { ResendOTP } from "./ResendOTP";

describe("ResendOTP Provider & Email Delivery", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  test("generates 8-digit numeric verification tokens", async () => {
    const tokenGenerator = (ResendOTP as any).options?.generateVerificationToken;
    expect(typeof tokenGenerator).toBe("function");

    const tokens = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const token = await tokenGenerator();
      expect(token).toMatch(/^\d{8}$/);
      tokens.add(token);
    }
    // Verify entropy - 20 random 8-digit tokens shouldn't collapse into a single static value
    expect(tokens.size).toBeGreaterThan(1);
  });

  test("preserves 15-minute token expiry and provider ID", () => {
    expect((ResendOTP as any).options?.id).toBe("resend-otp");
    expect((ResendOTP as any).options?.maxAge).toBe(15 * 60);
  });

  test("uses RESEND_SENDER_EMAIL_AUTH when configured and sends to any Gmail recipient", async () => {
    process.env.RESEND_API_KEY = "re_test_dummy_key";
    process.env.RESEND_SENDER_EMAIL_AUTH = "auth@indiapay.example.com";

    const fetchCalls: any[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      fetchCalls.push({ url: url.toString(), init });
      return new Response(JSON.stringify({ id: "msg_12345" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      const sendFn = (ResendOTP as any).sendVerificationRequest;

      // Test sending to first Gmail address
      await sendFn({ identifier: "alice@gmail.com", token: "12345678" });
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].url).toBe("https://api.resend.com/emails");
      expect(fetchCalls[0].init.headers.Authorization).toBe("Bearer re_test_dummy_key");
      const body1 = JSON.parse(fetchCalls[0].init.body);
      expect(body1.from).toBe("auth@indiapay.example.com");
      expect(body1.to).toBe("alice@gmail.com");
      expect(body1.text).toContain("12345678");

      // Test sending to a second, distinct Gmail address
      await sendFn({ identifier: "bob@gmail.com", token: "87654321" });
      expect(fetchCalls.length).toBe(2);
      const body2 = JSON.parse(fetchCalls[1].init.body);
      expect(body2.from).toBe("auth@indiapay.example.com");
      expect(body2.to).toBe("bob@gmail.com");
      expect(body2.text).toContain("87654321");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("falls back to onboarding@resend.dev when RESEND_SENDER_EMAIL_AUTH is not configured", async () => {
    process.env.RESEND_API_KEY = "re_test_dummy_key";
    delete process.env.RESEND_SENDER_EMAIL_AUTH;

    const fetchCalls: any[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      fetchCalls.push({ url: url.toString(), init });
      return new Response(JSON.stringify({ id: "msg_12345" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      const sendFn = (ResendOTP as any).sendVerificationRequest;
      await sendFn({ identifier: "user@gmail.com", token: "45678901" });

      expect(fetchCalls.length).toBe(1);
      const body = JSON.parse(fetchCalls[0].init.body);
      expect(body.from).toBe("onboarding@resend.dev");
      expect(body.to).toBe("user@gmail.com");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("throws clear Resend API error when Resend rejects unverified recipient (403)", async () => {
    process.env.RESEND_API_KEY = "re_test_dummy_key";
    process.env.RESEND_SENDER_EMAIL_AUTH = "onboarding@resend.dev";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          statusCode: 403,
          message:
            "You can only send testing emails to your own email address. To send to other recipients, please verify a domain at resend.com/domains.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    try {
      const sendFn = (ResendOTP as any).sendVerificationRequest;
      await expect(
        sendFn({ identifier: "unverified@gmail.com", token: "11223344" }),
      ).rejects.toThrow(/Resend API error:.*You can only send testing emails to your own email address/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("falls back to internal.email.sendEmail when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    let dispatchedAction: any = null;
    let dispatchedArgs: any = null;
    const mockCtx = {
      runAction: async (ref: any, args: any) => {
        dispatchedAction = ref;
        dispatchedArgs = args;
      },
    };

    const sendFn = (ResendOTP as any).sendVerificationRequest;
    await sendFn({ identifier: "dev@example.com", token: "99887766" }, mockCtx);

    expect(dispatchedAction).toBeDefined();
    expect(dispatchedArgs).toEqual({
      to: "dev@example.com",
      subject: "Your sign-in code",
      text: "Your sign-in code is 99887766",
    });
  });
});
