import { Schema, model, Types } from "mongoose";





const messageSchema = new Schema({
    chatId: { 
        type: Types.ObjectId, 
        ref: 'Chat', 
        required: true 
    },
    senderId: { 
        type: Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    receiverId: { 
        type: Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        trim: true 
    },
    media: { 
        public_id: String,
        secure_url: String
    },
    status: { 
        type: String, 
        enum: ['sent', 'delivered', 'seen'], 
        default: 'sent' 
    }
}, { timestamps: true });


messageSchema.index({ chatId: 1, createdAt: 1 });

export const messageModel = model('Message', messageSchema);