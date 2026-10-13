/**
 * Dev account provisioning script.
 *
 * Usage (PowerShell):
 *   $env:DEV_ADMIN_PASSWORD = "AdminTest@2026!"
 *   $env:DEV_USER_PASSWORD  = "UserTest@2026!"
 *   bun run scripts/provisionDevAccounts.ts
 *
 * Or:
 *   bun dev:provision
 *
 * Prerequisites:
 *   - Convex dev deployment accessible
 *   - DEV_SEED=1 set on the Convex deployment:
 *       npx convex env set DEV_SEED 1
 *
 * Security:
 *   - Plaintext passwords are read only from environment variables ($env:DEV_ADMIN_PASSWORD, $env:DEV_USER_PASSWORD).
 *   - Passwords are never hardcoded in source code or committed to git.
 *   - Passwords are never logged to console or stderr.
 *   - Passwords are hashed locally using Scrypt (lucia) before being sent to Convex.
 *   - Convex only ever receives and stores Scrypt hashes.
 *   - Guarded by DEV_SEED=1 check so it can never run against production.
 */

import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { Scrypt } from "lucia";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../packages/backend");

function checkEnvVar(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(
      `\n❌  Missing environment variable: ${name}\n` +
        `    Set it before running:\n` +
        `    $env:${name} = "<password>"\n`,
    );
    process.exit(1);
  }
  return val;
}

function validatePassword(label: string, password: string): void {
  if (
    password.length < 8 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    console.error(
      `\n❌  ${label} does not meet requirements: ` +
        "must be at least 8 characters and include uppercase, lowercase, and a number.\n",
    );
    process.exit(1);
  }
}

async function main() {
  console.log("🔧  IndiaPay Dev Account Provisioner");
  console.log("─────────────────────────────────────");

  const adminPassword = checkEnvVar("DEV_ADMIN_PASSWORD");
  const userPassword = checkEnvVar("DEV_USER_PASSWORD");

  validatePassword("DEV_ADMIN_PASSWORD", adminPassword);
  validatePassword("DEV_USER_PASSWORD", userPassword);

  console.log("✅  Password policy verified (not logging values)");
  console.log("🔒  Hashing passwords locally with Scrypt (lucia)...");

  const scrypt = new Scrypt();
  const [adminHash, userHash] = await Promise.all([
    scrypt.hash(adminPassword),
    scrypt.hash(userPassword),
  ]);

  console.log("✅  Scrypt hashes generated securely");
  console.log("📡  Syncing accounts to Convex dev deployment...\n");

  const argsJson = JSON.stringify({ adminHash, userHash });
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "npx.cmd" : "npx";

  const res = spawnSync(
    cmd,
    [
      "convex",
      "run",
      "devAccountsMutation:provisionDevAccountsMutation",
      argsJson,
      "--no-push",
    ],
    {
      cwd: backendDir,
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf-8",
    },
  );

  if (res.status !== 0) {
    const stderr = res.stderr ?? "";
    const stdout = res.stdout ?? "";
    if (
      stderr.includes("Dev/seed functions are disabled") ||
      stdout.includes("Dev/seed functions are disabled")
    ) {
      console.error(
        "\n❌  DEV_SEED is not enabled on the Convex deployment.\n" +
          "    Enable it with:\n" +
          "    npx convex env set DEV_SEED 1\n",
      );
    } else {
      console.error("\n❌  Provisioning failed:");
      console.error(stderr || stdout);
    }
    process.exit(1);
  }

  console.log(res.stdout);
  console.log("\n✅  Dev accounts provisioned successfully!");
  console.log("\n📋  Account Credentials Summary:");
  console.log("    ────────────────────────────────────────────────────────");
  console.log("    ADMIN ACCOUNT:");
  console.log("      Email: admin@indiapaypayroll.com");
  console.log("      Role:  Admin (not Owner)");
  console.log("      Workspace: IndiaPay Dev Workspace");
  console.log("    NORMAL USER ACCOUNT:");
  console.log("      Email: user@indiapaypayroll.com");
  console.log("      Role:  Member / User");
  console.log("      Workspace: IndiaPay Dev Workspace");
  console.log("    ────────────────────────────────────────────────────────");
  console.log("🔒  Passwords: Use the passwords set in your environment variables.");
  console.log("🌐  Sign In URL: http://localhost:3000/login (or http://localhost:3001/login)");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
