import { Router } from "express";
import * as NT from "./Notifications.controller.js"
import { auth } from "../../../middleware/Auth/auth.js";





const NotificationRouter= Router()



NotificationRouter.get("/GetNotifications",auth, NT.GetAllUserNotifications);

NotificationRouter.patch("/MarkAsReaded",auth,NT.MarkUserNotificationsAsReaded);



export default NotificationRouter

