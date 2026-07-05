import { userModel } from "../../../DB/models/User/UserMainModel/user.model.js";
import { streamModel } from "../../../DB/models/LiveStream/LiveStream.model.js";
import { LiveStreamMessageModel } from "../../../DB/models/LiveStreamMessages/LiveStreamMessages.model.js";
import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import MyPusher from "../../service/Pusher/PusherConfig.js";



export const SendLiveStreamMessage = asyncHandler(async (req, res, next) => {


  const { streamKey, message } = req.body;
  const userId = req.user._id;
  const FullSenderName= req.user.firstName + req.user.lastName;
  const senderName = FullSenderName; 



  if (!streamKey || !message) {
    return next(new Error("Stream key and message are required", { cause: 400 }));
  }


  
  const user = await userModel.findById(userId);
  if (user.isChatBanned) {
    return next(new Error("You are banned from chatting in this stream", { cause: 403 }));
  }



  const activeStream = await streamModel.findOne({ streamKey, isActive: true });  
  if (!activeStream) {
    return next(new Error("This stream is currently offline or does not exist", { cause: 404 }));
  }


  const newMessage = await LiveStreamMessageModel.create({
    streamKey,
    senderId: req.user._id,
    senderName: req.user.firstName +  req.user.lastName,
    message
  });


  await MyPusher.trigger(`stream-${streamKey}`, "new-message", {
    message,
    sender: senderName,
    timestamp: new Date()
  });

  

  return res.status(200).json({ status: "success", message: "Message sent!" });
});


export const getChatHistory = asyncHandler(async (req, res, next) => {
    const { streamKey } = req.params; 
    
  
    const messages = await LiveStreamMessageModel
        .find({ streamKey })
        .sort({ createdAt: 1 }) 
        .limit(50);

    return res.status(200).json({ status: "success", data: messages });
});