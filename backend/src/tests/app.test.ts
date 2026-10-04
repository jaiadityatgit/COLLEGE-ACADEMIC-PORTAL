import request from "supertest";
import app from "../app";

// Mock mongoose and database connection config
jest.mock("../config/database", () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  getDatabaseKind: jest.fn().mockReturnValue("memory"),
  isDatabaseAtlas: jest.fn().mockReturnValue(false),
  isDatabaseMemory: jest.fn().mockReturnValue(true),
}));

// Mock the Mongoose models to avoid hitting the actual database
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock user model specifically
jest.mock("../models/User.model", () => {
  return {
    findOne: jest.fn(),
    findById: jest.fn(),
  };
});

describe("Express Server API Smoke Tests", () => {
  it("GET /health should return 200 and status healthy", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "healthy");
    expect(response.body).toHaveProperty("timestamp");
  });

  it("POST /api/v1/auth/login with invalid data should trigger validation failure (400)", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "invalid-email", password: "" });
    // Since password must be present and email must be valid format, validation should return 400
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });
});
