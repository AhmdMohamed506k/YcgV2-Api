import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import {notificationModel} from "../../../DB/models/notifications/Notifications.model.js";







export const GetMyNotifications = asyncHandler(async (req, res, next) => {


   const userId = req.user._id;

   const userNotifications = await notificationModel.find({recipient:req.user._id}).sort({createdAt: -1}).limit(10);
    
   const unreadCount = await notificationModel.countDocuments({ recipient: req.user._id,  isRead: false });
 
    res.status(200).json({ status: "success", unreadCount, data: userNotifications});
})


export const MarkUserNotificationsAsRead= asyncHandler(async (req,res,next)=>{
     
    await notificationModel.updateMany({recipient:req.user._id, isRead: false },{$set:{isRead: true}})
    res.status(200).json({ status: "success", Msg:"Done"});
})
