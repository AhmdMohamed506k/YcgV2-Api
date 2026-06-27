import { Schema, model, Types } from "mongoose";

// JobApplicationModel.js
const jobApplicationSchema = new Schema({
    jobId: { 
      type: Types.ObjectId, 
      ref: "Job", 
      required: true 
    }, 
    applicantId: { 
      type: Types.ObjectId, 
      ref: "user", 
      required: true 
    },
    companyId: { 
      type: Types.ObjectId, 
      ref: "Company", 
      required: true 
    },
    jobSnapshot: {
        title: { type: String, required: true },
        Position: { type: String, required: true },
        description: { type: String, required: true },
        requirements: [{ type: String }],
        locationType: { type: String, required: true },
        jobType: { type: String, required: true },
        experienceLevel: { type: String, required: true },
        salary: {min: { type: Number }, max: { type: Number },currency: { type: String }}
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
    cv: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true }
    },
    status: { 
      type: String,
      enum: ["pending", "viewed", "accepted", "rejected"],
      default: "pending" 
    },
    coverLetter: { 
      type: String, 
      maxLength: 1000 
    },
    addedBy: { 
      type: Types.ObjectId,
      ref: "user", 
      required: true 
    } 
},{

  timestamps: true 

});

jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

export const applicationModel = model("Application", jobApplicationSchema);