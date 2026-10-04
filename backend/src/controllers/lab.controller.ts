import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import Lab from "../models/Lab.model";

export async function getLabs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const labs = await Lab.find({
      collegeId: req.user?.collegeId,
    }).populate("labInchargeId", "name").populate("courseIds", "name courseCode");

    res.status(200).json({
      success: true,
      data: labs
    });
  } catch (error) {
    next(error);
  }
}

export async function createLab(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const lab = await Lab.create({
      ...req.body,
      collegeId: req.user?.collegeId
    });

    res.status(201).json({
      success: true,
      data: lab
    });
  } catch (error) {
    next(error);
  }
}
