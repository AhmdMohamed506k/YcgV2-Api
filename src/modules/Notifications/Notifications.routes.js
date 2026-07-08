import { Router } from "express";
import * as NT from "./notifications.controller.js"
import { auth } from "../../middleware/auth/auth.js";
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";





const NotificationRouter= Router()



NotificationRouter.get("/GetNotifications",auth,activeIdentity , NT.GetMyNotifications);

NotificationRouter.patch("/MarkAsRead",auth,activeIdentity ,NT.MarkUserNotificationsAsRead);



export default NotificationRouter

