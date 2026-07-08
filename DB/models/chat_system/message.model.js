import { Schema, model, Types } from "mongoose";

const messageSchema = new Schema(
  {
    chatId: {
      type: Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: Types.ObjectId,
      required: true,
      refPath: "senderType", 
    },
    senderType: {
      type: String,
      required: true,
      enum: ["user", "Company"],
    },
    receiverId: {
      type: Types.ObjectId,
      required: true,
      refPath: "receiverType", 
    },
    receiverType: {
      type: String,
      required: true,
      enum: ["user", "Company"],
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
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    realSenderId: { 
      type: Types.ObjectId, 
      ref: "user",
      required: true 
    }, 
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: 1 });

export const messageModel = model("Message", messageSchema);
