import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export interface UploadResult {
  url: string;
  key: string;
  path?: string;
}

export interface StorageFileStream {
  stream: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
}

export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult>;
  deleteFile(keyOrPath: string): Promise<void>;
  getFileStream(keyOrPath: string): Promise<StorageFileStream | null>;
}

function sanitizeFilename(originalName: string): string {
  const base = path.basename(originalName);
  return base.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_PATH || "./uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    const safeName = sanitizeFilename(file.originalname);
    const filename = `${Date.now()}-${uuidv4().substring(0, 8)}-${safeName}`;
    const targetFolder = folder ? path.join(this.uploadDir, folder) : this.uploadDir;

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const targetPath = path.join(targetFolder, filename);

    if (file.path && fs.existsSync(file.path) && file.path !== targetPath) {
      fs.copyFileSync(file.path, targetPath);
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore unlink error
      }
    } else if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    }

    const relativeUrlPath = folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;
    return {
      url: relativeUrlPath,
      key: folder ? `${folder}/${filename}` : filename,
      path: targetPath
    };
  }

  async deleteFile(keyOrPath: string): Promise<void> {
    if (!keyOrPath) return;
    const sanitizedKey = keyOrPath.replace(/^\/uploads\//, "");
    const fullPath = path.resolve(this.uploadDir, sanitizedKey);

    // Prevent path traversal
    if (!fullPath.startsWith(this.uploadDir)) {
      console.warn("⚠️ Path traversal attempt prevented during file deletion:", keyOrPath);
      return;
    }

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.warn("⚠️ Failed to delete local file:", err);
      }
    }
  }

  async getFileStream(keyOrPath: string): Promise<StorageFileStream | null> {
    if (!keyOrPath) return null;
    const sanitizedKey = keyOrPath.replace(/^\/uploads\//, "");
    const fullPath = path.resolve(this.uploadDir, sanitizedKey);

    // Strict path traversal protection
    if (!fullPath.startsWith(this.uploadDir)) {
      console.warn("⚠️ Path traversal attempt prevented during getFileStream:", keyOrPath);
      return null;
    }

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stat = fs.statSync(fullPath);
    return {
      stream: fs.createReadStream(fullPath),
      contentLength: stat.size
    };
  }
}

class S3StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";
    this.bucket = process.env.AWS_BUCKET_NAME || "";
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
      }
    });
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    const safeName = sanitizeFilename(file.originalname);
    const key = `${folder ? folder + "/" : ""}${Date.now()}-${uuidv4()}-${safeName}`;

    let bodyData: fs.ReadStream | Buffer;
    if (file.path && fs.existsSync(file.path)) {
      bodyData = fs.createReadStream(file.path);
    } else if (file.buffer) {
      bodyData = file.buffer;
    } else {
      throw new Error("No file content available for S3 upload");
    }

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: bodyData,
          ContentType: file.mimetype || "application/octet-stream"
        })
      );

      // Clean up local temp file
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore unlink error
        }
      }

      const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      return { url, key };
    } catch (error) {
      console.error("❌ AWS S3 Upload Error:", error);
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteFile(keyOrPath: string): Promise<void> {
    if (!keyOrPath) return;
    const key = keyOrPath.includes("amazonaws.com/")
      ? keyOrPath.split("amazonaws.com/")[1]
      : keyOrPath;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key
        })
      );
    } catch (error) {
      console.error("❌ AWS S3 Delete Error:", error);
    }
  }

  async getFileStream(keyOrPath: string): Promise<StorageFileStream | null> {
    if (!keyOrPath) return null;
    const key = keyOrPath.includes("amazonaws.com/")
      ? keyOrPath.split("amazonaws.com/")[1]
      : keyOrPath;

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key
        })
      );

      if (!response.Body) return null;

      return {
        stream: response.Body as unknown as NodeJS.ReadableStream,
        contentType: response.ContentType,
        contentLength: response.ContentLength
      };
    } catch (error) {
      console.error("❌ AWS S3 GetObject Error:", error);
      return null;
    }
  }
}

class R2StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;
  private customDomain?: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || "";
    this.bucket = process.env.R2_BUCKET_NAME || "";
    this.customDomain = process.env.R2_CUSTOM_DOMAIN;

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ""
      }
    });
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    const safeName = sanitizeFilename(file.originalname);
    const key = `${folder ? folder + "/" : ""}${Date.now()}-${uuidv4()}-${safeName}`;

    let bodyData: fs.ReadStream | Buffer;
    if (file.path && fs.existsSync(file.path)) {
      bodyData = fs.createReadStream(file.path);
    } else if (file.buffer) {
      bodyData = file.buffer;
    } else {
      throw new Error("No file content available for Cloudflare R2 upload");
    }

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: bodyData,
          ContentType: file.mimetype || "application/octet-stream"
        })
      );

      // Clean up local temp file
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore unlink error
        }
      }

      const baseUrl = this.customDomain
        ? this.customDomain.replace(/\/+$/, "")
        : `https://${this.bucket}.${process.env.R2_ACCOUNT_ID}.r2.dev`;

      const url = `${baseUrl}/${key}`;
      return { url, key };
    } catch (error) {
      console.error("❌ Cloudflare R2 Upload Error:", error);
      throw new Error(`Cloudflare R2 upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteFile(keyOrPath: string): Promise<void> {
    if (!keyOrPath) return;
    const key = keyOrPath.startsWith("http")
      ? keyOrPath.replace(/^https?:\/\/[^\/]+\//, "")
      : keyOrPath;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key
        })
      );
    } catch (error) {
      console.error("❌ Cloudflare R2 Delete Error:", error);
    }
  }

  async getFileStream(keyOrPath: string): Promise<StorageFileStream | null> {
    if (!keyOrPath) return null;
    const key = keyOrPath.startsWith("http")
      ? keyOrPath.replace(/^https?:\/\/[^\/]+\//, "")
      : keyOrPath;

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key
        })
      );

      if (!response.Body) return null;

      return {
        stream: response.Body as unknown as NodeJS.ReadableStream,
        contentType: response.ContentType,
        contentLength: response.ContentLength
      };
    } catch (error) {
      console.error("❌ Cloudflare R2 GetObject Error:", error);
      return null;
    }
  }
}

export function getStorageService(): IStorageService {
  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase().trim();
  if (provider === "s3") {
    return new S3StorageService();
  }
  if (provider === "r2") {
    return new R2StorageService();
  }
  return new LocalStorageService();
}
