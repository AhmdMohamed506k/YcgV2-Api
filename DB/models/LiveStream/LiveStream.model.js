
import mongoose, { Schema, model } from "mongoose";

const streamSchema = new Schema({

    streamKey: { type: String, required: true, unique: true }, 
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: false }, 
    status: { type: String, enum: ['online', 'offline'], default: 'offline' }


}, { timestamps: true });

export const streamModel = mongoose.model("Stream", streamSchema);