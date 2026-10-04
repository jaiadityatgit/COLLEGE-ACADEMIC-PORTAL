import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import FacultyProfile from "../models/FacultyProfile.model";

export async function getFacultyProfiles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profiles = await FacultyProfile.find({
      collegeId: req.user?.collegeId,
    }).populate("userId", "name email");

    res.status(200).json({
      success: true,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
}

export async function getFacultyProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await FacultyProfile.findOne({
      userId: req.params.userId,
      collegeId: req.user?.collegeId
    }).populate("userId", "name email");

    if (!profile) {
      res.status(404).json({ success: false, message: "Faculty profile not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}
