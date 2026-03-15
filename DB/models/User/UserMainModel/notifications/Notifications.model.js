import { Schema, model, Types } from "mongoose";

const notificationSchema = new Schema({
    recipient: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderProfileImg:{
       secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["message", "like", "follow", "repost","comment","CommentLike"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const notificationModel = model("Notification", notificationSchema);
