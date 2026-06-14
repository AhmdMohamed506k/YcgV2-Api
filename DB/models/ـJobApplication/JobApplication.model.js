import { Schema, model, Types } from "mongoose";

const jobApplicationSchema = new Schema({

    jobId: { 
        type: Types.ObjectId, 
        ref: "Job", 
        required: true 
    },
    applicantId: { 
        type: Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    companyId: { 
        type: Types.ObjectId, 
        ref: "Company", 
        required: true 
    },
    
    jobSnapshot: {
      title: {
        type: String,
        required: true 
      },
      description: {
        type: String,
        required: true 
      },
      requirements: [{
        type: String
      },],
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
      MustHaveQualifications: {
        type: String,
      },
      PreferredQualifications: {
        type: String,
      },
    },


    screeningQuestions: [{
        question: { type: String, required: true },
        required: { type: Boolean, default: true }, 
        idealAnswer: { type: String } 
    }],
    answers: [{
        question: { type: String, required: true },
        answer: { type: String, required: true }     
    }],
    rejectionSettings: {
        preview: { type: String }, 
        enabled: { type: Boolean, default: false },
        autoReject: { type: Boolean, default: false } 
    },


    status: { 
        type: String, 
        enum: ["pending", "viewed", "accepted", "rejected"], 
        default: "pending" 
    },
    addedBy: {
      type: Types.ObjectId,
      ref: "user", 
      required: true,
    },
    state: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    coverLetter: { 
        type: String, 
        maxLength: 1000 
    }
}, { 
    timestamps: true 
});

jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

export const JobApplicationModel = model("Application", jobApplicationSchema);