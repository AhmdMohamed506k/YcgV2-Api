import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";

import { chatModel } from "../../../DB/models/ChatSystem/Chat.model.js";
import { messageModel } from "../../../DB/models/ChatSystem/Message.model.js";
import MyPusher from "../../service/Pusher/PusherConfig.js";



export const sendMessage = asyncHandler(async (req, res, next) => {

    const { receiverId, text } = req.body;
    const senderId = req.user._id; //loggedIn user
    const fullUserName = req.user.firstName + req.user.lastName //loggedIn User Full name


    
    let chat= await chatModel.findOne({
        participants:{$all:[senderId,receiverId]}
    })
    if(!chat){
        chat= await chatModel.create({
            participants:[senderId,receiverId],
            senderId,   
            receiverId,
            newMessagesCount:0
        })
    }
    const newMessage=await messageModel.create({
        chatId:chat._id,
        senderId,
        receiverId,
        text
    })

    chat.lastMessage = newMessage._id;
    chat.senderId = newMessage.senderId;
    chat.receiverId=newMessage.receiverId;
    chat.MessagIsReaded=false
    chat.newMessagesCount +=1

    await chat.save()



    await MyPusher.trigger(`user-${receiverId}`,"new Message",{
        chat:chat._id,
        message:{
            _id:newMessage._id,
            text:newMessage.text,
            senderId:senderId,
            senderName:fullUserName,
            senderProfileImg:req.user.userProfileImg,
            createdAt:newMessage.createdAt
        },
        newMessagesCount:chat.newMessagesCount
    })


    res.status(201).json({ status: "success", message: "Message sent successfully", data: newMessage});
});

export const GetMyChats = asyncHandler(async(req,res,next)=>{


    const chats = await chatModel.find({participants:req.user._id}).populate({
        path:"participants",
        select:("user","firstName lastName userProfileImg userSubTitle status lastSeen")
    })
    .populate("lastMessage").sort({updatedAt:-1});

    res.status(200).json({status:"success",data: chats})

})

export const GetSpecificChatHistory = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const userId = req.user._id;

   
    const MessagesHistory = await messageModel.find({ chatId })
    .populate("senderId", "firstName lastName userProfileImg")
    .sort({ createdAt: 1 });

  
    const chat = await chatModel.findOneAndUpdate(
        { _id: chatId, receiverId: userId }, 
        { $set: { newMessagesCount: 0, MessagIsReaded: true } },
        { new: true }
    );

  
    const updateResult = await messageModel.updateMany(
        { chatId, senderId: { $ne: userId }, status: "sent" },
        { $set: { status: "seen" } }
    );

    
    if (updateResult.modifiedCount > 0) {
        const otherParticipant = chat?.participants.find(id => id.toString() !== userId.toString());

        if (otherParticipant) {
            await MyPusher.trigger(`user-${otherParticipant}`, "messages-seen", { chatId });
        }
    }

    res.status(200).json({ status: "success", data: MessagesHistory });
});