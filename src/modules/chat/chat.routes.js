import { Router } from "express";
import * as chatController from "./chat.controller.js";
import * as CCV from "./chat.validation.js";
import { auth } from "../../middleware/auth/auth.js"; 
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";
import { validate } from "../../middleware/validation/validation.js";


const ChatRouter = Router();


ChatRouter.post("/sendMessage", auth,activeIdentity,validate(CCV.chatValidation.sendMessage), chatController.sendMessage);


ChatRouter.get("/MyChat", auth,activeIdentity, chatController.GetMyChats);


ChatRouter.get("/history/:chatId", auth,activeIdentity,validate(CCV.chatValidation.getChatHistoryt), chatController.GetSpecificChatHistory);

export default ChatRouter;