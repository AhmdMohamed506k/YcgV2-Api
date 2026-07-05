
import mongoose, { Schema, model } from "mongoose";

const LiveStreamMessageSchema = new Schema({
    streamKey: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
}, { timestamps: true });

export const LiveStreamMessageModel = mongoose.model("LiveStreamMessage", LiveStreamMessageSchema);