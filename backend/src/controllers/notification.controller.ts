import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Notification from "../models/Notification.model";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({
      collegeId: req.user?.collegeId,
      userId: req.user?.id
    }).sort({ createdAt: -1 }).limit(50);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { userId: req.user?.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "Marked all as read" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Internal helper for other controllers to use
export const createNotification = async (
  collegeId: string, 
  userId: string, 
  title: string, 
  message: string, 
  type: string, 
  actionUrl?: string
) => {
  const newNotif = new Notification({
    collegeId,
    userId,
    title,
    message,
    type,
    actionUrl
  });
  await newNotif.save();
};
