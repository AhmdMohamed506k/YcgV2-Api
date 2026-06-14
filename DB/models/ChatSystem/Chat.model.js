import { Schema, model, Types } from "mongoose";

const chatSchema = new Schema({
   
    participants: [{
        participantId: { 
            type: Types.ObjectId, 
            required: true,
            refPath: 'participants.participantType' 
        },
        participantType: { 
            type: String, 
            required: true, 
            enum: ['user', 'Company'] 
        }
    }],
    participantIds: [{
        type: Types.ObjectId,
        index: true 
    }],
    startedBy: { 
        type: Types.ObjectId, 
        ref: 'user',
        required: true 
    },
    lastMessage: { 
        type: Types.ObjectId, 
        ref: 'Message' 
    },
    unreadCounts: [{
        participantId: { type: Types.ObjectId },
        count: { type: Number, default: 0 }
    }]

},{ 
    timestamps: true 
});


chatSchema.index({ participantIds: 1 });

export const chatModel = model('Chat', chatSchema);