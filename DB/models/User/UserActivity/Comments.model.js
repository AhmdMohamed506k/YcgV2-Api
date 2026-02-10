import { Schema, model, Types } from "mongoose";

const commentSchema = new Schema({
    ActivityId: {
      type: Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },
   
    likes: [{ type: Types.ObjectId, ref: "user" }],


  },{ 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });



export const commentModel = model("Comment", commentSchema);