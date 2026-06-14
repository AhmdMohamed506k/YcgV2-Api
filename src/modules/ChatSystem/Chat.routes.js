import { Router } from "express";
import * as chatController from "./Chat.controller.js";
import { auth } from "../../middleware/Auth/auth.js"; 
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";


const ChatRouter = Router();


ChatRouter.post("/sendMessage", auth,activeIdentity, chatController.sendMessage);


ChatRouter.get("/MyChat", auth,activeIdentity, chatController.GetMyChats);


ChatRouter.get("/history/:chatId", auth,activeIdentity, chatController.GetSpecificChatHistory);

export default ChatRouter;