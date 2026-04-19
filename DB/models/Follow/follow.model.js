import { Schema, model } from "mongoose";

const followSchema = new Schema(
  {
  
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
 
    followedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);



followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });


followSchema.index({ followerId: 1 });

followSchema.index({ followingId: 1 });

export const followModel = model("Follow", followSchema);