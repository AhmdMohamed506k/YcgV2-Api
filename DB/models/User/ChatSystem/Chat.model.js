
import { Schema, model, Types } from "mongoose";


const chatSchema = new Schema({
    participants: [{ // Channel ID
        type: Types.ObjectId, 
        ref: 'User', 
        required: true 
    }],
    senderId: { 
        type: Types.ObjectId, 
        ref: 'user', 
        required:true
    },
    receiverId: { 
        type: Types.ObjectId, 
        ref: 'user', 
        required:true
    },
    MessagIsReaded:{
       type:Boolean,
       default:false
    },
    newMessagesCount: { 
        type: Number,
        default:0
    },
    lastMessage: { 
        type: Types.ObjectId, 
        ref: 'Message' 
    }
}, { timestamps: true });


chatSchema.index({ participants: 1 });

export const chatModel = model('Chat', chatSchema);