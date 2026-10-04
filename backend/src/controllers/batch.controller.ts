import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import Batch from "../models/Batch.model";

export async function getBatches(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const batches = await Batch.find({
      collegeId: req.user?.collegeId,
    }).populate("currentSemesterId").sort({ startYear: -1, section: 1 });

    res.status(200).json({
      success: true,
      data: batches
    });
  } catch (error) {
    next(error);
  }
}

export async function createBatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const batch = await Batch.create({
      ...req.body,
      collegeId: req.user?.collegeId
    });

    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    next(error);
  }
}
