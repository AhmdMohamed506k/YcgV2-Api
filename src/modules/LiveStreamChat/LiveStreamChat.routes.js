


import * as LvC from "./LiveStreamChat.controller.js";
import { auth } from "../../middleware/Auth/auth.js";
import { Router } from "express";



const LiveStreamChatRouter = Router() 

LiveStreamChatRouter.post("/sendMessage", auth, LvC.SendLiveStreamMessage);


LiveStreamChatRouter.get("/history/:streamKey", auth, LvC.getChatHistory);



export default LiveStreamChatRouter;