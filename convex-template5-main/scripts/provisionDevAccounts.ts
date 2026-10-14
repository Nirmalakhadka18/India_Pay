/**
 * Dev account provisioning script.
 *
 * Usage (PowerShell):
 *   $env:DEV_OWNER_PASSWORD = "<OwnerPassword>"
 *   $env:DEV_ADMIN_PASSWORD = "<AdminPassword>"
 *   $env:DEV_USER_PASSWORD  = "<UserPassword>"
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
 *   - Plaintext passwords are read only from environment variables ($env:DEV_OWNER_PASSWORD, $env:DEV_ADMIN_PASSWORD, $env:DEV_USER_PASSWORD).
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

  const ownerPassword = process.env.DEV_OWNER_PASSWORD;
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;
  const userPassword = process.env.DEV_USER_PASSWORD;

  if (!ownerPassword && !adminPassword && !userPassword) {
    console.error(
      "\n❌  Missing required environment variables.\n" +
        "    Please set at least one account password before running:\n" +
        '    $env:DEV_OWNER_PASSWORD = "<password>"\n' +
        '    $env:DEV_ADMIN_PASSWORD = "<password>"\n' +
        '    $env:DEV_USER_PASSWORD  = "<password>"\n',
    );
    process.exit(1);
  }

  const scrypt = new Scrypt();
  let ownerHash: string | undefined;
  let adminHash: string | undefined;
  let userHash: string | undefined;

  if (ownerPassword) {
    validatePassword("DEV_OWNER_PASSWORD", ownerPassword);
    ownerHash = await scrypt.hash(ownerPassword);
    console.log("✅  DEV_OWNER_PASSWORD verified & hashed locally with Scrypt");
  }
  if (adminPassword) {
    validatePassword("DEV_ADMIN_PASSWORD", adminPassword);
    adminHash = await scrypt.hash(adminPassword);
    console.log("✅  DEV_ADMIN_PASSWORD verified & hashed locally with Scrypt");
  }
  if (userPassword) {
    validatePassword("DEV_USER_PASSWORD", userPassword);
    userHash = await scrypt.hash(userPassword);
    console.log("✅  DEV_USER_PASSWORD verified & hashed locally with Scrypt");
  }

  console.log("🔒  Scrypt hashes generated securely (no plaintext logged)");
  console.log("📡  Syncing accounts to Convex dev deployment...\n");

  const argsJson = JSON.stringify({ ownerHash, adminHash, userHash });
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
  if (ownerHash) {
    console.log("    OWNER ACCOUNT:");
    console.log("      Email:     owner@indiapaypayroll.com");
    console.log("      Role:      Owner");
    console.log("      Workspace: IndiaPay Dev Workspace");
  }
  if (adminHash) {
    console.log("    ADMIN ACCOUNT:");
    console.log("      Email:     admin@indiapaypayroll.com");
    console.log("      Role:      Admin (not Owner)");
    console.log("      Workspace: IndiaPay Dev Workspace");
  }
  if (userHash) {
    console.log("    NORMAL USER ACCOUNT:");
    console.log("      Email:     user@indiapaypayroll.com");
    console.log("      Role:      Member / User");
    console.log("      Workspace: IndiaPay Dev Workspace");
  }
  console.log("    ────────────────────────────────────────────────────────");
  console.log("🔒  Passwords: Use the passwords set in your environment variables.");
  console.log("🌐  Sign In URL: http://localhost:3000/login (or http://localhost:3001/login)");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
