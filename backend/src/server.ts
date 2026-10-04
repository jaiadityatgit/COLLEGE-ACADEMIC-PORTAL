import "dotenv/config";

import app from "./app";
import { connectDatabase, getDatabaseKind, isDatabaseAtlas, isDatabaseMemory } from "./config/database";

import fs from "fs";
import User from "./models/User.model";
import { seedDatabase } from "./seed";

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const uploadDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function bootstrap() {
  try {
    await connectDatabase();


    const dbKind = getDatabaseKind();
    const onAtlas = isDatabaseAtlas();
    const onMemory = isDatabaseMemory();
    const explicitSeedAtlas = process.env.SEED_ATLAS === "1";

    if (onAtlas) {
      console.log("ℹ️ Atlas database detected — auto-seed SKIPPED (production protection).");
      if (explicitSeedAtlas) {
        console.warn("⚠️  SEED_ATLAS=1 is set — however, automatic Atlas seeding");
        console.warn("   is disabled. To seed Atlas, run `npm run seed` manually and");
        console.warn("   independently. Startup will continue without seeding.");
      }
    } else {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        if (onMemory) {
          console.log("ℹ️ Empty in-memory database detected. Auto-seeding demo data...");
          await seedDatabase();
        } else {
          console.log(`ℹ️ Empty ${dbKind === "local" ? "local MongoDB" : "database"} detected (0 users).`);
          console.log("   Auto-seed SKIPPED for non-memory, non-Atlas database.");
          console.log("   To populate: run `npm run seed` manually.");
        }
      } else {
        console.log(`ℹ️ Found existing data (${userCount} users). Seeding not required.`);
      }
    }

    const server = app.listen(PORT, HOST, () => {
      const dbLabel =
        dbKind === "atlas" ? "MongoDB Atlas" :
        dbKind === "local" ? "MongoDB Local" :
        "MongoMemoryServer";
      console.log("");
      console.log("=" .repeat(68));
      console.log(`✅ Academic Portal Backend running on ${HOST}:${PORT}`);
      console.log(`🌍 Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(`💾 Database    : ${dbLabel}`);
      console.log(`🏠 Frontend    : ${process.env.FRONTEND_URL || "(not set)"}`);
      console.log("=".repeat(68));
      console.log("");
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log("🔒 HTTP server closed.");
        try {
          const { disconnectDatabase } = await import("./config/database");
          await disconnectDatabase();
          console.log("💾 MongoDB connection closed cleanly.");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error during database disconnect:", err);
          process.exit(1);
        }
      });

      // Force exit after 10s if hanging
      setTimeout(() => {
        console.error("⚠️ Forced shutdown after timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Bootstrap failed:", error);
    process.exit(1);
  }
}

bootstrap();
