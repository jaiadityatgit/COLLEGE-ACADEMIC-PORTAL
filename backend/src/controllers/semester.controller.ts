import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import Semester from "../models/Semester.model";

export async function getSemesters(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId } = req.query;
    const query: any = { collegeId: req.user?.collegeId };
    if (departmentId) query.departmentId = departmentId;

    const semesters = await Semester.find(query).sort({ academicYear: -1, number: 1 });

    res.status(200).json({
      success: true,
      data: semesters
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveSemester(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId } = req.query;
    const query: any = {
      collegeId: req.user?.collegeId,
      isActive: true
    };
    if (departmentId) query.departmentId = departmentId;

    const semester = await Semester.findOne(query);

    if (!semester) {
      res.status(404).json({ success: false, message: "No active semester found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: semester
    });
  } catch (error) {
    next(error);
  }
}

export async function createSemester(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const { name, number, academicYear, startDate, endDate, departmentId, regulationYear, isActive } = req.body;

    if (!name || !number || !academicYear || !startDate || !endDate || !departmentId) {
      res.status(400).json({ success: false, error: "Missing required semester fields" });
      return;
    }

    if (isActive) {
      // Deactivate currently active semester in this department first
      await Semester.updateMany(
        { collegeId, departmentId, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const semester = await Semester.create({
      name: String(name).trim(),
      number: Number(number),
      academicYear: String(academicYear).trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      departmentId,
      regulationYear: regulationYear ? String(regulationYear).trim() : undefined,
      isActive: !!isActive,
      collegeId
    });

    res.status(201).json({
      success: true,
      data: semester
    });
  } catch (error) {
    next(error);
  }
}

export async function activateSemester(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;

    const targetSemester = await Semester.findOne({ _id: id, collegeId });
    if (!targetSemester) {
      res.status(404).json({ success: false, error: "Semester not found" });
      return;
    }

    // Deactivate existing active semester for this department
    await Semester.updateMany(
      { collegeId, departmentId: targetSemester.departmentId, isActive: true },
      { $set: { isActive: false } }
    );

    targetSemester.isActive = true;
    await targetSemester.save();

    res.status(200).json({
      success: true,
      message: `Semester "${targetSemester.name}" (${targetSemester.academicYear}) is now the active academic context`,
      data: targetSemester
    });
  } catch (error) {
    next(error);
  }
}

export async function closeSemester(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;

    const targetSemester = await Semester.findOne({ _id: id, collegeId });
    if (!targetSemester) {
      res.status(404).json({ success: false, error: "Semester not found" });
      return;
    }

    targetSemester.isActive = false;
    await targetSemester.save();

    res.status(200).json({
      success: true,
      message: `Semester "${targetSemester.name}" closed. Historical academic records remain safely archived and recoverable.`,
      data: targetSemester
    });
  } catch (error) {
    next(error);
  }
}
