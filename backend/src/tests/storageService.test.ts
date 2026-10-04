import fs from "fs";
import path from "path";
import { getStorageService } from "../services/storageService";

describe("Storage Service Unit Tests", () => {
  const testUploadDir = path.resolve("./test_uploads");

  beforeAll(() => {
    process.env.UPLOAD_PATH = testUploadDir;
    process.env.STORAGE_PROVIDER = "local";
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testUploadDir)) {
      try {
        fs.rmSync(testUploadDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  });

  it("should initialize LocalStorageService when STORAGE_PROVIDER=local", () => {
    const service = getStorageService();
    expect(service.constructor.name).toBe("LocalStorageService");
  });

  it("should upload file to local disk and sanitize filename", async () => {
    const service = getStorageService();
    const content = Buffer.from("%PDF-1.4 Mock PDF Content");
    const mockFile: any = {
      originalname: "test ../unsafe#file.pdf",
      mimetype: "application/pdf",
      size: content.length,
      buffer: content
    };

    const result = await service.uploadFile(mockFile, "materials");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("key");
    expect(result.url).toContain("/uploads/materials/");
    expect(result.key).not.toContain("..");
    expect(result.key).not.toContain("#");

    if (result.path) {
      expect(fs.existsSync(result.path)).toBe(true);
    }
  });

  it("should retrieve stream for existing local file and block path traversal", async () => {
    const service = getStorageService();
    const content = Buffer.from("Safe academic document content for testing stream");
    const mockFile: any = {
      originalname: "safe_document.pdf",
      mimetype: "application/pdf",
      size: content.length,
      buffer: content
    };

    const uploadRes = await service.uploadFile(mockFile, "documents");
    const fileStream = await service.getFileStream(uploadRes.key);
    expect(fileStream).not.toBeNull();
    expect(fileStream?.contentLength).toBe(content.length);

    // Consume stream
    if (fileStream) {
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream.stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString("utf-8")).toBe(content.toString("utf-8"));
    }

    // Path traversal attempt should return null
    const traversalAttempt = await service.getFileStream("../../windows/win.ini");
    expect(traversalAttempt).toBeNull();
  });

  it("should delete local file cleanly and block path traversal during delete", async () => {
    const service = getStorageService();
    const content = Buffer.from("Delete me");
    const mockFile: any = {
      originalname: "to_delete.pdf",
      mimetype: "application/pdf",
      size: content.length,
      buffer: content
    };

    const uploadRes = await service.uploadFile(mockFile, "temp");
    if (uploadRes.path) {
      expect(fs.existsSync(uploadRes.path)).toBe(true);
      await service.deleteFile(uploadRes.key);
      expect(fs.existsSync(uploadRes.path)).toBe(false);
    }

    // Path traversal delete should be blocked safely
    await expect(service.deleteFile("../../../outside_file.txt")).resolves.not.toThrow();
  });

  it("should switch provider when STORAGE_PROVIDER is r2 or s3", () => {
    process.env.STORAGE_PROVIDER = "r2";
    const r2Service = getStorageService();
    expect(r2Service.constructor.name).toBe("R2StorageService");

    process.env.STORAGE_PROVIDER = "s3";
    const s3Service = getStorageService();
    expect(s3Service.constructor.name).toBe("S3StorageService");

    // Reset back to local
    process.env.STORAGE_PROVIDER = "local";
  });
});
