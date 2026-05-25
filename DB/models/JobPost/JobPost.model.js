import { Schema, model, Types } from "mongoose";

const jobSchema = new Schema( {

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    requirements: [{
        type: String, // المهارات أو المتطلبات المطلوبة
      },
    ],
    locationType: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      required: true,
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ["junior", "mid-level", "senior", "lead"],
      required: true,
    },
    salary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: "EGP" },
    },

    companyId: {
      type: Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    addedBy: {
      type: Types.ObjectId,
      ref: "user", 
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


jobSchema.index({ status: 1, createdAt: -1 });

export const jobModel = model("Job", jobSchema);