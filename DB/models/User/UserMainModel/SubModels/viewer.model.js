
const viewSchema = new Schema({
    viewerId: { 
        type: Schema.Types.ObjectId, 
        ref: "user", 
        required: true 
    },
    profileId: { 
        type: Schema.Types.ObjectId, 
        ref: "user", 
        required: true,
        index: true 
    },
    viewedAt: { type: Date, default: Date.now }
});

export const viewModel = model("View", viewSchema);