import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: process.env.PORT || "5000",
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "").toLowerCase() === "production",
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret-replace-in-prod",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-replace-in-prod",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  uploadPath: process.env.UPLOAD_PATH || "./uploads",
  storageProvider: (process.env.STORAGE_PROVIDER || "local").toLowerCase().trim(),
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "",
    customDomain: process.env.R2_CUSTOM_DOMAIN || ""
  },
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucketName: process.env.AWS_BUCKET_NAME || ""
  }
};
