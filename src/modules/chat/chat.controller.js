import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import { chatModel } from "../../../DB/models/chat_system/chat.model.js";
import { messageModel } from "../../../DB/models/chat_system/message.model.js";
import MyPusher from "../../service/pusher/pusher_config.js";
import redisClient from "../../utils/redis_client/redis_client.js"; 

// ==========================================
// 1. Send Message
// ==========================================
export const sendMessage = asyncHandler(async (req, res, next) => {
    const { receiverId, receiverType, text } = req.body;
    const { id: senderId, type: senderType, name: senderName, img: senderImg } = req.identity;

    let chat = await chatModel.findOne({participantIds: { $all: [senderId, receiverId] } });
    
   
    
    if (!chat) {
        chat = await chatModel.create({
            participants: [{ participantId: senderId, participantType: senderType },
                { participantId: receiverId, participantType: receiverType }
            ],
            participantIds: [senderId, receiverId],
            startedBy: req.user._id,
            unreadCounts: [
                { participantId: senderId, count: 0 },
                { participantId: receiverId, count: 0 }
            ]
        });
    }

   
    const newMessage = await messageModel.create({
        chatId: chat._id,
        senderId,
        senderType,
        receiverId,
        receiverType,
        realSenderId: req.user._id,
        text
    });

  
    await chatModel.findByIdAndUpdate(
        chat._id, 
        { 
            lastMessage: newMessage._id, 
            $inc: { "unreadCounts.$[elem].count": 1 } 
        }, 
        {
            arrayFilters: [{ "elem.participantId": receiverId }],
            timestamps: true,
            new: true
        }
    );

   
     redisClient.del([`ChatHistory:${chat._id}`,`ChatsList:${senderId}`,`ChatsList:${receiverId}`,`Notifications:${receiverId}`]);


    await MyPusher.trigger(receiverId.toString(), "new-message", {
        chatId: chat._id,
        message: {
            _id: newMessage._id,
            text: newMessage.text,
            senderId,
            senderName,
            senderProfileImg: senderImg,
            createdAt: newMessage.createdAt
        }
    });

    res.status(201).json({ status: "success", data: newMessage });
});

// ==========================================
// 2. Get My Chats
// ==========================================
export const GetMyChats = asyncHandler(async (req, res, next) => {

    const { id: activeId } = req.identity;
    const cacheKey = `ChatsList:${activeId}`;

  
    const cachedChats = await redisClient.get(cacheKey);
    if (cachedChats) {
        return res.status(200).json({ status: "success", source: "Cache", data: JSON.parse(cachedChats) });
    }

  
    const chats = await chatModel.find({ participantIds: activeId })
    .populate({
        path: "participants.participantId",
        select: "firstName lastName userProfileImg CompanyName Logo userSubTitle status"
    })
    .populate("lastMessage")
    .sort({ updatedAt: -1 });


    if (chats.length > 0) {
        await redisClient.set(cacheKey, JSON.stringify(chats), { EX: 120 });
    }

    res.status(200).json({ status: "success", source: "DB", data: chats });
});

// ==========================================
// 3. Get Specific Chat History
// ==========================================
export const GetSpecificChatHistory = asyncHandler(async (req, res, next) => {


    const { chatId } = req.params;
    const { id: activeId } = req.identity;
    const cacheKey = `ChatHistory:${chatId}`;

    const chat = await chatModel.findOneAndUpdate(
        { _id: chatId, "unreadCounts.participantId": activeId },
        { $set: { "unreadCounts.$.count": 0 } },
        { new: true }
    );

    const updateResult = await messageModel.updateMany(
        { chatId, receiverId: activeId, status: "sent" },
        { $set: { status: "seen" } }
    );

    if (updateResult.modifiedCount > 0) {
        await redisClient.del([cacheKey, `ChatsList:${activeId}`]);
        
        const otherParticipantId = chat?.participantIds.find(id => id.toString() !== activeId.toString());
        if (otherParticipantId) {

            await redisClient.del(`ChatsList:${otherParticipantId}`);
            await MyPusher.trigger(otherParticipantId.toString(), "messages-seen", { chatId });
        }
    }

    const cachedHistory = await redisClient.get(cacheKey);
    if (cachedHistory) {
        return res.status(200).json({ status: "success", source: "Cache", data: JSON.parse(cachedHistory) });
    }

    const MessagesHistory = await messageModel.find({ chatId }).sort({ createdAt: 1 });

    if (MessagesHistory.length > 0) {
        await redisClient.set(cacheKey, JSON.stringify(MessagesHistory), { EX: 300 });
    }

    res.status(200).json({ status: "success", source: "DB", data: MessagesHistory });
});