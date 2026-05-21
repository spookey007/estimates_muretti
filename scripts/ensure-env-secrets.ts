import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const path = join(process.cwd(), ".env");
if (!existsSync(path)) {
  console.error(".env not found");
  process.exit(1);
}

let env = readFileSync(path, "utf-8");

function ensure(key: string, generator: () => string): void {
  if (new RegExp(`^${key}=`, "m").test(env)) return;
  env += `\n${key}=${generator()}\n`;
  console.log(`Added ${key}`);
}

ensure("JWT_ACCESS_SECRET", () => randomBytes(48).toString("base64url"));
ensure("JWT_REFRESH_SECRET", () => randomBytes(48).toString("base64url"));
ensure("APP_URL", () => "http://localhost:3000");

writeFileSync(path, env);
console.log("Done.");
