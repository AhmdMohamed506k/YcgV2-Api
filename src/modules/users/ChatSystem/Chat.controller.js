import { chatModel } from "../../../../DB/models/User/ChatSystem/Chat.model";



export const sendMessage = asyncHandler(async (req, res, next) => {
    const { receiverId, text } = req.body;
    const senderId = req.user._id;

    
    // check if there any chat between the 2 users If not Create new Chat
    let chat = await chatModel.findOne({
        participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
        chat = await chatModel.create({
            participants: [senderId, receiverId]
        });
    }

 
    //Create the Message and store it
    const message = await messageModel.create({chatId: chat._id,senderId, receiverId, text });

    
    // update the Chat with the last Message
    chat.lastMessage = message._id;
    await chat.save();

 
    // calling the io server
    const io = req.app.get("io"); 
    
    // send the Message to the other user room
    io.to(receiverId.toString()).emit("newMessage", { chatId: chat._id, message});

    res.status(201).json({status: "success", data: message });
});