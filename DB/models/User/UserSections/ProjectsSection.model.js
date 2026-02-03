import mongoose, { model, Types } from "mongoose";

const ProjectsSectionSchema = new mongoose.Schema({
  ProjectName: {
    type: String,
    lowercase: true,
    required: true,
  },
  Description: {
    type: String,
    lowercase: true,
  },
  UsedSkills: {
    type: [String],
    default: [],
  },
  Media: {
    secure_url: { type: String, default: null },
    public_id: { type: String, default: null },
  },
  MediaCoverImage: {
    secure_url: { type: String, default: null },
    public_id: { type: String, default: null },
  },
  CreatedBy: {
    type: Types.ObjectId,
    ref: "user",
    required: true,
  },
});

const ProjectsSectionModel = model("ProjectsSectionModel",ProjectsSectionSchema);
export { ProjectsSectionSchema, ProjectsSectionModel };
