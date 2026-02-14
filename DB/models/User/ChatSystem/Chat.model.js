
import { Schema, model, Types } from "mongoose";


const chatSchema = new Schema({
    participants: [{ 
        type: Types.ObjectId, 
        ref: 'User', 
        required: true 
    }],
    lastMessage: { 
        type: Types.ObjectId, 
        ref: 'Message' 
    }
}, { timestamps: true });


chatSchema.index({ participants: 1 });

export const chatModel = model('Chat', chatSchema);