import { Schema, model, Types } from "mongoose";

const ActivitySchema = new Schema({
    text: {
      type: String,
      trim: true,
    },
    ActivityType: {
      type: String,
      enum: ["text", "image", "video", "repost"],
      required: true,
    },
    media: {
      secure_url: String,
      public_id: String,
    },
    videoCover: {
      secure_url: String,
      public_id: String,
    },
    CommentsCount: { 
      type: Number,
      default: 0 
    },
    likes: [{
      type: Types.ObjectId,
      ref: "user",
    }],
    LikesCount: { 
      type: Number,
      default: 0 
    },

    repostsCount: { 
      type: Number,
      default: 0 
    },
    isRepost: { 
      type: Boolean, 
      default: false 
    },
    originalActivity: { 
      type: Types.ObjectId, 
      ref: "Activity", 
      default: null 
    },
    CreatedBy: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },



},{

    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

});

ActivitySchema.index({ CreatedBy: 1, createdAt: -1 });
ActivitySchema.index({ originalActivity: 1 });


ActivitySchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "ActivityId",
});

export const ActivityModel = model("Activity", ActivitySchema);
