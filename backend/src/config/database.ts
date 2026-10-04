import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();

// Fix Windows / ISP DNS SRV lookup failures (querySrv ECONNREFUSED) for MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Ignore if custom DNS servers cannot be set
}

export type DatabaseKind = "atlas" | "local" | "memory";

let mongod: any = null;
let _dbKind: DatabaseKind | null = null;

export function getDatabaseKind(): DatabaseKind {
  if (_dbKind) return _dbKind;
  const uri = process.env.MONGODB_URI || "";
  if (uri.includes("mongodb+srv://") || uri.includes(".mongodb.net")) return "atlas";
  if (uri.includes("localhost") || uri.includes("127.0.0.1")) return "local";
  return "memory";
}

export function isDatabaseAtlas(): boolean {
  return getDatabaseKind() === "atlas";
}

export function isDatabaseMemory(): boolean {
  return getDatabaseKind() === "memory";
}

function maskUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

function printMemoryWarningBanner(): void {
  const line = "=".repeat(70);
  const warn = (s: string) =>
    "║ " + s + " ".repeat(Math.max(0, 66 - s.length)) + " ║";
  console.warn("");
  console.warn("╔" + "═".repeat(68) + "╗");
  console.warn(warn(""));
  console.warn(warn("⚠️  WARNING: USING EPHEMERAL MONGODB MEMORY DATABASE"));
  console.warn(warn(""));
  console.warn(warn("  DATA WILL BE LOST ON RESTART."));
  console.warn(warn("  This instance is NOT connected to MongoDB Atlas."));
  console.warn(warn("  All attendance, marks, assignments, and user records"));
  console.warn(warn("  created here will be permanently deleted when the"));
  console.warn(warn("  backend process exits."));
  console.warn(warn(""));
  console.warn(warn("  For persistent storage, configure a valid MONGODB_URI"));
  console.warn(warn("  pointing to MongoDB Atlas and ensure the IP is"));
  console.warn(warn("  whitelisted in Atlas Network Access."));
  console.warn(warn(""));
  console.warn("╚" + "═".repeat(68) + "╝");
  console.warn("");
}

function printDatabaseStartupBanner(kind: DatabaseKind, uriSummary: string): void {
  const label =
    kind === "atlas"
      ? "MongoDB Atlas"
      : kind === "local"
      ? "MongoDB Local"
      : "MongoMemoryServer (EPHEMERAL)";
  const tag =
    kind === "atlas"
      ? "PERSISTENT"
      : kind === "local"
      ? "LOCAL"
      : "⚠️  NON-PERSISTENT";
  console.log("");
  console.log("┌" + "─".repeat(68) + "┐");
  console.log(`│ DATABASE: ${label.padEnd(58)} │`);
  console.log(`│ MODE    : ${tag.padEnd(58)} │`);
  console.log(`│ URI     : ${uriSummary.padEnd(58)} │`);
  console.log("└" + "─".repeat(68) + "┘");
  console.log("");
}

async function startMemoryServer(): Promise<string> {
  mongod = await MongoMemoryServer.create();
  const memUri = mongod.getUri();
  _dbKind = "memory";
  printMemoryWarningBanner();
  return memUri;
}

export async function connectDatabase(): Promise<void> {
  const nodeEnv = (process.env.NODE_ENV || "development").trim().toLowerCase();
  const isProd = nodeEnv === "production";
  const explicitSeedFlag = process.env.FORCE_MEMORY_DB === "1";

  let uri = process.env.MONGODB_URI || "";
  const hasRealUri = !!uri && !uri.includes("<db_password>");
  const uriIsAtlas = uri.includes("mongodb+srv://") || uri.includes(".mongodb.net");
  const uriIsLocal = !uriIsAtlas && (uri.includes("localhost") || uri.includes("127.0.0.1"));

  const useMemoryFromStart = !hasRealUri || uri.includes("<db_password>") || explicitSeedFlag;

  if (useMemoryFromStart) {
    if (isProd) {
      console.error("");
      console.error("❌ FATAL: Production mode requires a valid MONGODB_URI (not memory DB).");
      console.error("   Either configure a persistent MongoDB URI or set NODE_ENV != production.");
      console.error("   In-memory MongoDB is NOT permitted in production.");
      console.error("");
      process.exit(2);
    }
    console.log("ℹ️ Starting in-memory MongoDB server (no valid URI provided)...");
    uri = await startMemoryServer();
    printDatabaseStartupBanner("memory", maskUri(uri));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB connected (in-memory)");
    return;
  }

  if (uriIsAtlas) _dbKind = "atlas";
  else if (uriIsLocal) _dbKind = "local";
  else _dbKind = "local";

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    printDatabaseStartupBanner(_dbKind!, maskUri(uri));
    console.log("✅ MongoDB connected");
    return;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error instanceof Error ? error.message : String(error));

    if (isProd || uriIsAtlas) {
      if (uriIsAtlas) {
        console.error("");
        console.error("❌ Refusing to fall back to in-memory database because the configured");
        console.error("   URI points to MongoDB Atlas. Silent fallback would lose the");
        console.error("   connection to persistent production data.");
        console.error("");
        console.error("   Troubleshooting steps:");
        console.error("    1. Verify Atlas Network Access whitelist includes this IP.");
        console.error("    2. Confirm Atlas cluster is running and not paused.");
        console.error("    3. Verify MONGODB_URI credentials (username/password) are correct.");
        console.error("    4. Check TLS/network egress to *.mongodb.net:27017.");
        console.error("");
      } else {
        console.error("");
        console.error("❌ Production mode — refusing to fall back to in-memory database.");
        console.error("   Fix the MongoDB connection and restart the server.");
        console.error("");
      }
      process.exit(3);
    }

    if (!mongod) {
      try {
        console.log("ℹ️ [DEV] Falling back to in-memory MongoDB server after connection failure...");
        uri = await startMemoryServer();
        printDatabaseStartupBanner("memory", maskUri(uri));
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ In-memory MongoDB connected (as DEV fallback)");
        return;
      } catch (innerError) {
        console.error("❌ Fatal: In-memory MongoDB fallback also failed:", innerError);
        throw innerError;
      }
    } else {
      throw error;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
    _dbKind = null;
  }
}

