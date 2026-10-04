import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, error: "Email already registered" });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: "student"
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Please provide email and password" });
      return;
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: "User account is suspended" });
      return;
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role, collegeId: user.collegeId },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "15m") as any }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || "fallbackrefreshsecret"),
      { expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || "7d") as any }
    );

    user.lastLogin = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          collegeId: user.collegeId
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully" });
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, error: "No refresh token provided" });
      return;
    }

    const decoded = jwt.verify(token, (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || "fallbackrefreshsecret")) as any;
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: "User account is suspended" });
      return;
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role, collegeId: user.collegeId },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "15m") as any }
    );

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}
