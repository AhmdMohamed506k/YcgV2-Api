import { model, Schema } from "mongoose";



const activityViewSchema = new Schema({
    activityId: {
        type: Schema.Types.ObjectId,
        ref: "Activity",
        required: true,
        index: true,
    },
    viewerId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "viewerType" 
    },
    viewerType: {
        type: String,
        required: true,
        enum: ["user", "company"], 
    },
    viewedAt: { type: Date, default: Date.now }
});
export const activityViewModel = model("ActivityView", activityViewSchema);