import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";

import { chatModel } from "../../../DB/models/ChatSystem/Chat.model.js";
import { messageModel } from "../../../DB/models/ChatSystem/Message.model.js";
import MyPusher from "../../service/Pusher/PusherConfig.js";


export const sendMessage = asyncHandler(async (req, res, next) => {
    
    const { receiverId, receiverType, text } = req.body;
    const { id: senderId, type: senderType, name: senderName, img: senderImg } = req.identity;

    // 1. البحث عن شات يجمع بين الطرفين بهويتهم (يوزر-يوزر، يوزر-شركة.. إلخ)
    let chat = await chatModel.findOne({
        participantIds: { $all: [senderId, receiverId] }
    });

    if (!chat) {
        chat = await chatModel.create({
            participants: [
                { participantId: senderId, participantType: senderType },
                { participantId: receiverId, participantType: receiverType }
            ],
            participantIds: [senderId, receiverId],
            startedBy: req.user._id, // اليوزر الحقيقي اللي بدأ الشات
            unreadCounts: [
                { participantId: senderId, count: 0 },
                { participantId: receiverId, count: 0 }
            ]
        });
    }

    // 2. إنشاء الرسالة
    const newMessage = await messageModel.create({
        chatId: chat._id,
        senderId,
        senderType,
        receiverId,
        receiverType,
        realSenderId: req.user._id,
        text
    });

    // 3. تحديث الشات وزيادة العداد للمستلم فقط
    await chatModel.findByIdAndUpdate(chat._id, {lastMessage: newMessage._id, $inc: { "unreadCounts.$[elem].count": 1 } }, {

        arrayFilters: [{ "elem.participantId": receiverId }],
        new: true
        
    });


    // 4. إرسال Pusher (القناة تعتمد على ID المستلم سواء شركة أو يوزر)
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

export const GetMyChats = asyncHandler(async (req, res, next) => {
    const { id: activeId } = req.identity;

    const chats = await chatModel.find({ participantIds: activeId })
        .populate({
            path: "participants.participantId",
            select: "firstName lastName userProfileImg CompanyName Logo userSubTitle status"
        })
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

    res.status(200).json({ status: "success", data: chats });
});

export const GetSpecificChatHistory = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const { id: activeId } = req.identity;

    // 1. جلب الرسايل مع عمل populate للراسل الحقيقي (اختياري للرقابة)
    const MessagesHistory = await messageModel.find({ chatId })
        .sort({ createdAt: 1 });

    // 2. تصفير العداد للمشارك الحالي في هذا الشات
    const chat = await chatModel.findOneAndUpdate(
        { _id: chatId, "unreadCounts.participantId": activeId },
        { $set: { "unreadCounts.$.count": 0 } },
        { new: true }
    );

    // 3. تحديث حالة الرسايل التي لم يرسلها المستخدم الحالي لتصبح "seen"
    const updateResult = await messageModel.updateMany(
        { chatId, receiverId: activeId, status: "sent" },
        { $set: { status: "seen" } }
    );

    // 4. إبلاغ الطرف الآخر عبر Pusher أن الرسايل شوهدت
    if (updateResult.modifiedCount > 0 && chat) {
        const otherParticipantId = chat.participantIds.find(id => id.toString() !== activeId.toString());
        
        if (otherParticipantId) {
            await MyPusher.trigger(otherParticipantId.toString(), "messages-seen", { chatId });
        }
    }

    res.status(200).json({ status: "success", data: MessagesHistory });
});