import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import { notificationModel } from "../../../DB/models/notifications/notifications.model.js";
import redisClient from "../../utils/redis_client/redis_client.js";

// ==========================================
// 1. Get My Notifications
// ==========================================
export const GetMyNotifications = asyncHandler(async (req, res, next) => {

    const recipientId = req.identity.id; 
    const cacheKey = `Notifications:${recipientId}`;

    const cachedNotifications = await redisClient.get(cacheKey);
    if (cachedNotifications) {
        return res.status(200).json({ status: "success", source: "Cache", data: JSON.parse(cachedNotifications) });
    }


    const userNotifications = await notificationModel.find({ recipient: recipientId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("sender", "firstName lastName userProfileImg CompanyName Logo");

    const unreadCount = await notificationModel.countDocuments({ 
        recipient: recipientId, 
        isRead: false 
    });

    const responseData = { unreadCount, data: userNotifications };

    
    await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 60 });

    res.status(200).json({ status: "success", source: "DB", ...responseData });
});

// ==========================================
// 2. Mark as Read
// ==========================================
export const MarkUserNotificationsAsRead = asyncHandler(async (req, res, next) => {
    const recipientId = req.identity.id;

    const updateResult = await notificationModel.updateMany(
        { recipient: recipientId, isRead: false },
        { $set: { isRead: true } }
    );

    
    if (updateResult.modifiedCount > 0) {
        await redisClient.del(`Notifications:${recipientId}`);
    }

    res.status(200).json({ status: "success", message: "All notifications marked as read" });
});