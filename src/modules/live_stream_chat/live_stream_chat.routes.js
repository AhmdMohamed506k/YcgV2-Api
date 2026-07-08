


import * as LvC from "./live_stream_chat.controller.js";
import { auth } from "../../middleware/auth/auth.js";
import { Router } from "express";



const LiveStreamChatRouter = Router() 

LiveStreamChatRouter.post("/sendMessage", auth, LvC.SendLiveStreamMessage);


LiveStreamChatRouter.get("/history/:streamKey", auth, LvC.getChatHistory);



export default LiveStreamChatRouter;