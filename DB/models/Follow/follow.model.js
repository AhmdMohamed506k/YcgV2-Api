import { Schema, Types, model } from "mongoose";

const followSchema = new Schema({
    followerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: Types.ObjectId,
      required: true,
    },
    onModel: {
      type: String,
      required: true,
      enum: ["user", "Company"],
    },

    
  },{ 
    timestamps: true
  },
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });


export const followModel = model("Follow", followSchema);
