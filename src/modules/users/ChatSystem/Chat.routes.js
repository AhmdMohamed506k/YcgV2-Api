import { Router } from "express";
import * as chatController from "./Chat.controller.js";
import { auth } from "../../../middleware/Auth/auth.js"; 

const ChatRouter = Router();


ChatRouter.post("/sendMessage", auth, chatController.sendMessage);


ChatRouter.get("/history/:chatId", auth, chatController.getChatHistory);


ChatRouter.get("/myChats", auth, chatController.getMyChats);

export default ChatRouter;