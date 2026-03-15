
import { chatModel } from "../../../../DB/models/User/ChatSystem/Chat.model.js";
import { messageModel } from "../../../../DB/models/User/ChatSystem/Message.model.js";
import MyPusher from "../../../service/Pusher/PusherConfig.js";



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

    chat.lastMessage = newMessage.text;
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
            senderName:req.user.fullUserName,
            senderProfileImg:req.user.userProfileImg,
            createdAt:newMessage.createdAt
        },
        newMessagesCount:chat.newMessagesCount
    })


    res.status(201).json({ status: "success", message: "Message sent successfully", data: newMessage});
});

export const MarkChatAsReaded = asyncHandler(async (req,res,next)=>{

    const {chatId} = req.body;


    const chat = await chatModel.findByIdAndUpdate(chatId,{$set:{newMessagesCount:0 , MessagIsReaded:false}},{new:true});

    const otherParticipant = chat.participants.find((id)=> id.toString() !== req.user._id.toString())

    await MyPusher.trigger(`user-${otherParticipant}`,"message-seen",{
        chatId: chat._id,
        seenBy :req.user._id
    })

    res.status(200).json({ status: "success", message: "Chat marked as read" });

})