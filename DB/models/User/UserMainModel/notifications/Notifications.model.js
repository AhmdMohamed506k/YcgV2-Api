import { Schema, model, Types } from "mongoose";

const notificationSchema = new Schema({
    recipient: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["message", "like", "follow", "repost"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    relatedId: {
      type: Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const notificationModel = model("Notification", notificationSchema);
