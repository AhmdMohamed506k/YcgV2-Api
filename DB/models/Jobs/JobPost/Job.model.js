
import { Schema, model, Types } from "mongoose";


// JobModel.js
const jobSchema = new Schema({
    title: { 
        type: String,
        required: true 
    },
    description: { 
        type: String,
        required: true 
    },
    companyId: { 
        type: Types.ObjectId,
        ref: "Company",
        required: true 
    },
    requirements: [{ 
        type: String 
    }],
    locationType: { 
        type: String, 
        enum: ["onsite", "remote", "hybrid"], 
        required: true 
    },
    jobType: { 
        type: String,
        enum: ["full-time", "part-time", "contract", "internship"], 
        required: true 
    },
    experienceLevel: { 
        type: String, 
        enum: ["junior", "mid-level", "senior", "lead"],
        required: true 
    },
    salary: {
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        currency: { type: String, default: "EGP" }
    },
    screeningQuestions: [{
        question: { type: String, required: true },
        required: { type: Boolean, default: true }, 
        idealAnswer: { type: String } 
    }],
    rejectionSettings: {
        preview: { type: String }, 
        enabled: { type: Boolean, default: false },
        autoReject: { type: Boolean, default: false } 
    },
    MustHaveQualifications:[{
        type:String,
        
    }],
    PreferredQualifications:[{
        type:String,
        
    }],
    state: {
        type: String, 
        enum: ["open", "closed"], 
        default: "open" 
    },
    createdBy: { 
        type: Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    applicationsCount: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

export const jobModel = model("Job", jobSchema);